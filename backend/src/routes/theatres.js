const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/theatres
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT t.*,
        (SELECT COUNT(*) FROM shows s WHERE s.theatre_id = t.theatre_id) AS show_count,
        (SELECT MIN(st.date) FROM showtimes st
         JOIN shows s ON st.show_id = s.show_id
         WHERE s.theatre_id = t.theatre_id AND st.date >= CURDATE()) AS next_show_date,
        (SELECT s.title FROM shows s
         JOIN showtimes st ON st.show_id = s.show_id
         WHERE s.theatre_id = t.theatre_id AND st.date >= CURDATE()
         ORDER BY st.date ASC LIMIT 1) AS next_show_title
      FROM theatres t
    `;
    let params = [];

    if (search) {
      query += ' WHERE t.name LIKE ? OR t.location LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }

    const [theatres] = await pool.query(query, params);
    res.json(theatres);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/theatres/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM theatres WHERE theatre_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Theatre not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
