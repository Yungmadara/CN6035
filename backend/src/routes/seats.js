// ============================================================
//  Seat Routes — Διαθεσιμότητα Θέσεων
// ============================================================
//
//  Mountαρισμένο στο /api/showtimes — δηλαδή το πλήρες path
//  γίνεται /api/showtimes/:id/seats.
//
//  Επιστρέφει όλες τις θέσεις ενός showtime (διαθέσιμες +
//  κατειλημμένες) ώστε ο client να ζωγραφίσει το seat grid με
//  σωστά χρώματα (πράσινο/γκρι/χρυσό για επιλεγμένη).
//
//  Protected με JWT — μόνο logged-in users βλέπουν λεπτομέρειες
//  διαθεσιμότητας (αποτρέπει scraping από bots).
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/showtimes/:id/seats
// Path: από το app.use('/api/showtimes', seatRoutes) στο server.js
// Auth: JWT required
//
// Επιστρέφει array από seat objects με: seat_id, seat_number,
// category (VIP/Standard/Economy), is_available.
// Ταξινόμηση κατά seat_number (A1, A2, ..., L12).
// ─────────────────────────────────────────────────────────────
router.get('/:id/seats', authMiddleware, async (req, res) => {
  try {
    const [seats] = await pool.query(
      'SELECT * FROM seats WHERE showtime_id = ? ORDER BY seat_number',
      [req.params.id]
    );
    res.json(seats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
