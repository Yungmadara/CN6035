const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { seatPrice, generateReference } = require('../utils/pricing');

// GET /api/reservations/my  OR  /api/user/reservations
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

// POST /api/reservations — multi-seat booking in atomic transaction
router.post('/', authMiddleware, async (req, res) => {
  const { showtime_id } = req.body;
  // Accept both {seat_ids: [...]} (new) and {seat_id: ...} (backward compat)
  const seat_ids = Array.isArray(req.body.seat_ids)
    ? req.body.seat_ids
    : (req.body.seat_id ? [req.body.seat_id] : []);

  if (!showtime_id || seat_ids.length === 0) {
    return res.status(400).json({ message: 'showtime_id and seat_ids are required' });
  }
  if (seat_ids.length > 10) {
    return res.status(400).json({ message: 'Maximum 10 seats per reservation' });
  }
  if (!seat_ids.every(id => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ message: 'seat_ids must be positive integers' });
  }
  const uniqueIds = [...new Set(seat_ids)];
  if (uniqueIds.length !== seat_ids.length) {
    return res.status(400).json({ message: 'Duplicate seat_ids in request' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock requested seats
    const [seats] = await conn.query(
      'SELECT seat_id, category, is_available FROM seats WHERE seat_id IN (?) AND showtime_id = ? FOR UPDATE',
      [seat_ids, showtime_id]
    );

    if (seats.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Some seats were not found' });
    }
    const unavailable = seats.filter(s => !s.is_available);
    if (unavailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: `${unavailable.length} seat(s) not available` });
    }

    // Get base price for the showtime
    const [[showtime]] = await conn.query(
      'SELECT price FROM showtimes WHERE showtime_id = ?',
      [showtime_id]
    );
    if (!showtime) {
      await conn.rollback();
      return res.status(404).json({ message: 'Showtime not found' });
    }
    const basePrice = parseFloat(showtime.price);
    const reference = generateReference();

    // Insert N reservations with shared reference
    const insertRows = seat_ids.map(sid => [req.user.userId, showtime_id, sid, reference]);
    await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, seat_id, reservation_reference) VALUES ?',
      [insertRows]
    );

    // Mark seats unavailable
    await conn.query(
      'UPDATE seats SET is_available = FALSE WHERE seat_id IN (?)',
      [seat_ids]
    );

    // Decrement available_seats
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - ? WHERE showtime_id = ?',
      [seat_ids.length, showtime_id]
    );

    await conn.commit();

    const totalPrice = seats.reduce((sum, s) => sum + seatPrice(basePrice, s.category), 0);
    res.status(201).json({
      message: 'Reservation created',
      reference,
      count: seat_ids.length,
      totalPrice: Math.round(totalPrice * 100) / 100,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/reservations/:id  (change seat)
router.put('/:id', authMiddleware, async (req, res) => {
  const { new_seat_id } = req.body;

  if (!new_seat_id) {
    return res.status(400).json({ message: 'new_seat_id is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [reservations] = await conn.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ? AND status = "confirmed"',
      [req.params.id, req.user.userId]
    );
    if (reservations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = reservations[0];

    const [newSeat] = await conn.query(
      'SELECT * FROM seats WHERE seat_id = ? AND showtime_id = ? AND is_available = TRUE FOR UPDATE',
      [new_seat_id, reservation.showtime_id]
    );
    if (newSeat.length === 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'New seat is not available' });
    }

    await conn.query('UPDATE seats SET is_available = TRUE WHERE seat_id = ?', [reservation.seat_id]);
    await conn.query('UPDATE seats SET is_available = FALSE WHERE seat_id = ?', [new_seat_id]);
    await conn.query(
      'UPDATE reservations SET seat_id = ? WHERE reservation_id = ?',
      [new_seat_id, req.params.id]
    );

    await conn.commit();
    res.json({ message: 'Reservation updated' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/reservations/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [reservations] = await conn.query(
      'SELECT * FROM reservations WHERE reservation_id = ? AND user_id = ? AND status = "confirmed"',
      [req.params.id, req.user.userId]
    );
    if (reservations.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const reservation = reservations[0];

    await conn.query(
      'UPDATE reservations SET status = "cancelled" WHERE reservation_id = ?',
      [req.params.id]
    );
    await conn.query('UPDATE seats SET is_available = TRUE WHERE seat_id = ?', [reservation.seat_id]);
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
