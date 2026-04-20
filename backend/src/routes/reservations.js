const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// GET /api/reservations/my  OR  /api/user/reservations
router.get(['/my', '/reservations'], authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.reservation_id, r.status, r.created_at,
              s.title AS show_title, t.name AS theatre_name,
              st.date, st.time, st.room, st.price,
              se.seat_number, se.category
       FROM reservations r
       JOIN showtimes st ON r.showtime_id = st.showtime_id
       JOIN shows s ON st.show_id = s.show_id
       JOIN theatres t ON s.theatre_id = t.theatre_id
       JOIN seats se ON r.seat_id = se.seat_id
       WHERE r.user_id = ?
       ORDER BY st.date DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/reservations
router.post('/', authMiddleware, async (req, res) => {
  const { showtime_id, seat_id } = req.body;

  if (!showtime_id || !seat_id) {
    return res.status(400).json({ message: 'showtime_id and seat_id are required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [seats] = await conn.query(
      'SELECT * FROM seats WHERE seat_id = ? AND showtime_id = ? AND is_available = TRUE FOR UPDATE',
      [seat_id, showtime_id]
    );
    if (seats.length === 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Seat is not available' });
    }

    const [result] = await conn.query(
      'INSERT INTO reservations (user_id, showtime_id, seat_id) VALUES (?, ?, ?)',
      [req.user.userId, showtime_id, seat_id]
    );

    await conn.query('UPDATE seats SET is_available = FALSE WHERE seat_id = ?', [seat_id]);
    await conn.query(
      'UPDATE showtimes SET available_seats = available_seats - 1 WHERE showtime_id = ?',
      [showtime_id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Reservation created', reservationId: result.insertId });
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
