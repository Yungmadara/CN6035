// ============================================================
//  Theatre Routes — Δημόσιο API θεάτρων
// ============================================================
//
//  Όλα τα endpoints είναι public (δεν απαιτούν JWT). Επιτρέπουν
//  στο app να δείξει λίστες χωρίς να ζητήσει login.
//
//  Endpoints:
//   • GET /api/theatres        — λίστα όλων (με optional ?search=)
//   • GET /api/theatres/:id    — λεπτομέρειες ενός θεάτρου
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────
// GET /api/theatres
// Query params: ?search=<keyword>  (φιλτράρει σε name + location)
// Επιστρέφει theatre objects εμπλουτισμένα με 3 derived fields:
//   • show_count       — πόσες παραστάσεις έχει το θέατρο
//   • next_show_date   — ημερομηνία επόμενου showtime
//   • next_show_title  — τίτλος της επόμενης παράστασης
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    // Correlated subqueries υπολογίζουν stats για κάθε θέατρο.
    // CURDATE() φιλτράρει μελλοντικά showtimes (αγνοούμε τα παρελθόντα).
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

    // Optional search: parameterized για ασφάλεια έναντι SQL injection
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

// ─────────────────────────────────────────────────────────────
// GET /api/theatres/:id
// Επιστρέφει λεπτομέρειες ενός συγκεκριμένου θεάτρου,
// ή 404 αν δεν υπάρχει.
// ─────────────────────────────────────────────────────────────
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
