const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// GET /api/showtimes/:id/seats
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
