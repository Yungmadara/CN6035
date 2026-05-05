// ============================================================
//  Reservation Routes — Κρατήσεις (CRUD)
// ============================================================
//
//  Όλα τα endpoints είναι JWT-protected. Ο user_id λαμβάνεται
//  από το decoded JWT (req.user.userId), όχι από το request
//  body — αποτρέπει manipulation.
//
//  Endpoints:
//   • GET    /api/user/reservations OR /api/reservations/my
//          — όλες οι κρατήσεις του logged-in user
//   • POST   /api/reservations
//          — Multi-seat κράτηση σε ATOMIC TRANSACTION
//   • PUT    /api/reservations/:id
//          — Αλλαγή θέσης σε υπάρχουσα κράτηση
//   • DELETE /api/reservations/:id
//          — Soft-delete (status='cancelled')
//
//  Συνέπεια δεδομένων:
//   - Όλα τα multi-step writes γίνονται μέσα σε
//     pool.getConnection() + beginTransaction() + commit/rollback
//   - SELECT ... FOR UPDATE χρησιμοποιείται για να αποτρέψει
//     race conditions όταν 2 χρήστες προσπαθούν την ίδια θέση
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { seatPrice, generateReference } = require('../utils/pricing');

// ─────────────────────────────────────────────────────────────
// GET /api/reservations/my  ή  /api/user/reservations
// Επιστρέφει όλες τις κρατήσεις του logged-in user (confirmed
// + cancelled) με denormalized fields από joined tables, ώστε
// ο client να ζωγραφίσει το Profile χωρίς extra requests.
//
// ORDER BY: φρεσκότερα showtimes πρώτα + group by reference
// (ώστε το frontend να μπορεί να group-άρει εύκολα τα seats
// που ανήκουν στο ίδιο booking).
// ─────────────────────────────────────────────────────────────
router.get(['/my', '/reservations'], authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.status, r.created_at,
              r.reservation_reference,
              r.showtime_id,
              s.title AS show_title, t.name AS theatre_name,
              st.date, st.time, st.room, st.price AS base_price, st.price AS price,
              se.seat_id, se.seat_number, se.category
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       JOIN seats se ON r.seat_id = se.seat_id
       WHERE r.user_id = ?
       ORDER BY st.date DESC, r.reservation_reference`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/reservations — Multi-seat booking, atomic
// Body: { showtime_id, seat_ids: [1,2,3] }
//   ή legacy: { showtime_id, seat_id: 1 }
// Response: 201 { message, reference, count, totalPrice }
//
// Atomicity guarantee: είτε ΟΛΕΣ οι seats κρατούνται είτε ΚΑΜΙΑ.
// Αν κάποια seat δεν είναι διαθέσιμη ή προκύψει error, γίνεται
// πλήρες rollback — χωρίς orphaned rows.
// ─────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { showtime_id } = req.body;

  // Backward-compat: δεχόμαστε ΚΑΙ seat_ids (array, νέο API)
  // ΚΑΙ seat_id (single, παλιό API που χρησιμοποιούσε ο client πριν).
  const seat_ids = Array.isArray(req.body.seat_ids)
    ? req.body.seat_ids
    : (req.body.seat_id ? [req.body.seat_id] : []);

  // ── Input validation (πριν ανοίξουμε connection) ────────────
  if (!showtime_id || seat_ids.length === 0) {
    return res.status(400).json({ message: 'showtime_id and seat_ids are required' });
  }
  if (seat_ids.length > 10) {
    // Επιχειρησιακός κανόνας: μέγιστο 10 θέσεις/booking
    return res.status(400).json({ message: 'Maximum 10 seats per reservation' });
  }
  if (!seat_ids.every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ message: 'seat_ids must be positive integers' });
  }
  // Έλεγχος για duplicates στο input — π.χ. {seat_ids: [5, 5, 5]}
  // θα έδινε confusing error αργότερα στο SQL αν δεν το πιάσουμε εδώ.
  const uniqueIds = [...new Set(seat_ids)];
  if (uniqueIds.length !== seat_ids.length) {
    return res.status(400).json({ message: 'Duplicate seat_ids in request' });
  }

  // ── Δικός μας connection για transaction (αντί για pool.query) ──
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── 1. Lock seats με FOR UPDATE ──────────────────────────
    // Αυτό αποτρέπει concurrent transactions να επεξεργαστούν
    // τις ίδιες θέσεις. Αν 2 users πατήσουν "Confirm" ταυτόχρονα,
    // ο δεύτερος μπλοκάρει εδώ μέχρι ο πρώτος να commit-άρει.
    const [seats] = await conn.query(
      'SELECT seat_id, category, is_available FROM seats WHERE seat_id IN (?) AND showtime_id = ? FOR UPDATE',
      [seat_ids, showtime_id]
    );

    // Έλεγχος ότι όλα τα seat_ids αντιστοιχούν σε υπαρκτές θέσεις
    // του συγκεκριμένου showtime
    if (seats.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Some seats were not found' });
    }
    // Έλεγχος ότι καμία δεν είναι ήδη κρατημένη
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: `${unavailable.length} seat(s) not available` });
    }

    // ── 2. Φέρε την base price για να υπολογίσουμε totalPrice ──
    const [[showtime]] = await conn.query(
      'SELECT price FROM showtimes WHERE showtime_id = ?',
      [showtime_id]
    );
    if (!showtime) {
      await conn.rollback();
      return res.status(404).json({ message: 'Showtime not found' });
    }
    const basePrice = parseFloat(showtime.price);

    // ── 3. Generate booking reference ────────────────────────
    // BK-20260424-A7F3C2 — όλα τα N seats μοιράζονται ίδιο reference
    const reference = generateReference();

    // ── 4. Bulk INSERT N rows με κοινό reference ─────────────
    const insertRows = seat_ids.map(sid => [req.user.userId, showtime_id, sid, reference]);
    await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, seat_id, reservation_reference) VALUES ?',
      [insertRows]
    );

    // ── 5. Mark όλες τις seats ως κατειλημμένες ──────────────
    await conn.query(
      'UPDATE seats SET is_available = FALSE WHERE seat_id IN (?)',
      [seat_ids]
    );

    // ── 6. Update counter του showtime ───────────────────────
    // Το available_seats είναι denormalized — κρατιέται συγχρονισμένο
    // εντός της ίδιας transaction για consistency.
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [seat_ids.length, showtime_id]
    );

    // ── 7. COMMIT — όλα οκ, persist τα changes ───────────────
    await conn.commit();

    // ── Υπολογισμός total price (server-side, όχι client-trusted) ──
    const totalPrice = seats.reduce((sum, s) => sum + seatPrice(basePrice, s.category), 0);

    res.status(201).json({
      message: 'Reservation created',
      reference,                                              // π.χ. "BK-20260424-A7F3C2"
      count: seat_ids.length,                                 // πλήθος θέσεων
      totalPrice: Math.round(totalPrice * 100) / 100,         // σε ευρώ
    });
  } catch (err) {
    // Σε οποιοδήποτε σφάλμα → rollback ώστε να μη μείνει partial state
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    // Επιστροφή της σύνδεσης στο pool, ΠΑΝΤΑ (commit ή rollback)
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/reservations/:id — Αλλαγή θέσης σε υπάρχουσα κράτηση
// Body: { new_seat_id }
//
// Logic σε transaction:
//  1. Επιβεβαίωση ότι η reservation ανήκει στον user και είναι confirmed
//  2. Lock νέας θέσης + έλεγχος διαθεσιμότητας
//  3. Παλιά θέση → διαθέσιμη
//  4. Νέα θέση → κατειλημμένη
//  5. Update reservation row με το νέο seat_id
// ─────────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  const { new_seat_id } = req.body;

  if (!new_seat_id) {
    return res.status(400).json({ message: 'new_seat_id is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Έλεγχος ότι η reservation υπάρχει, ανήκει στον user, και είναι confirmed
    // (δεν αλλάζουμε θέση σε ακυρωμένες).
    const [reservations] = await conn.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ? AND status = "confirmed"',
      [req.params.id, req.user.userId]
    );
    if (reservations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = reservations[0];

    // Lock της νέας θέσης + έλεγχος ότι είναι (α) στο ίδιο showtime
    // και (β) διαθέσιμη.
    const [newSeat] = await conn.query(
      'SELECT * FROM seats WHERE seat_id = ? AND showtime_id = ? AND is_available = TRUE FOR UPDATE',
      [new_seat_id, reservation.showtime_id]
    );
    if (newSeat.length === 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'New seat is not available' });
    }

    // Swap: παλιά διαθέσιμη, νέα κατειλημμένη
    await conn.query('UPDATE seats SET is_available = TRUE WHERE seat_id = ?', [reservation.seat_id]);
    await conn.query('UPDATE seats SET is_available = FALSE WHERE seat_id = ?', [new_seat_id]);
    // Update αναφοράς στη reservation row
    await conn.query(
      'UPDATE reservations SET seat_id = ? WHERE reservation_id = ?',
      [new_seat_id, req.params.id]
    );

    // Σημείωση: το available_seats του showtime ΔΕΝ αλλάζει
    // (δεν προστέθηκε/αφαιρέθηκε θέση, απλά άλλαξε ποια)
    await conn.commit();
    res.json({ message: 'Reservation updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/reservations/:id — Ακύρωση κράτησης (soft delete)
//
// Δεν διαγράφουμε φυσικά τη row — απλά αλλάζουμε status σε
// 'cancelled'. Έτσι μένει στο ιστορικό του χρήστη.
//
// Ταυτόχρονα ελευθερώνουμε τη θέση και αυξάνουμε το counter
// available_seats του showtime — όλα σε ίδια transaction.
// ─────────────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ownership + status check (δεν ακυρώνουμε ήδη ακυρωμένες)
    const [reservations] = await conn.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ? AND status = "confirmed"',
      [req.params.id, req.user.userId]
    );
    if (reservations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = reservations[0];

    // Soft delete: status='cancelled' (το row μένει)
    await conn.query(
      'UPDATE reservations SET status = "cancelled" WHERE reservation_id = ?',
      [req.params.id]
    );
    // Free up τη θέση (θα γίνει επιλέξιμη για νέες κρατήσεις)
    await conn.query('UPDATE seats SET is_available = TRUE WHERE seat_id = ?', [reservation.seat_id]);
    // Increment counter
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats + 1 WHERE showtime_id = ?',
      [reservation.showtime_id]
    );

    await conn.commit();
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
