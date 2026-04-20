const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/shows
router.get('/', async (req, res) => {
  try {
    const { theatreId, title, date } = req.query;
    let query = `
      SELECT s.*, t.name AS theatre_name, t.location
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE 1=1
    `;
    const params = [];

    if (theatreId) {
      query += ' AND s.theatre_id = ?';
      params.push(theatreId);
    }
    if (title) {
      query += ' AND s.title LIKE ?';
      params.push(`%${title}%`);
    }
    if (date) {
      query += ' AND EXISTS (SELECT 1 FROM showtimes st WHERE st.show_id = s.show_id AND st.date = ?)';
      params.push(date);
    }

    const [shows] = await pool.query(query, params);
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shows/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, t.name AS theatre_name, t.location
       FROM shows s
       JOIN theatres t ON s.theatre_id = t.theatre_id
       WHERE s.show_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Show not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shows/:id/showtimes
router.get('/:id/showtimes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM showtimes WHERE show_id = ? ORDER BY date, time',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
