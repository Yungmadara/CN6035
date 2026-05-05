// ============================================================
//  Show Routes — Παραστάσεις & Showtimes
// ============================================================
//
//  Public endpoints για περιήγηση παραστάσεων και προγράμματος:
//   • GET /api/shows                    — λίστα με filters
//   • GET /api/shows/:id                — λεπτομέρειες παράστασης
//   • GET /api/shows/:id/showtimes      — διαθέσιμα showtimes
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────
// GET /api/shows
// Optional query params:
//   ?theatreId=<id>  — όλες οι παραστάσεις συγκεκριμένου θεάτρου
//   ?title=<text>    — φιλτράρισμα κατά τίτλο (LIKE %text%)
//   ?date=<YYYY-MM-DD> — μόνο όσες έχουν showtime τη συγκεκριμένη μέρα
//
// JOIN με theatres ώστε ο client να βλέπει theatre_name & location
// μαζί με την παράσταση χωρίς second request.
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { theatreId, title, date } = req.query;

    // "WHERE 1=1" τέχνασμα: επιτρέπει να προσθέτουμε άνετα AND clauses
    // χωρίς να ελέγχουμε αν είναι το πρώτο condition.
    let query = `
      SELECT s.*, t.name AS theatre_name, t.location
      FROM shows s
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE 1=1
    `;
    const params = [];

    // Δυναμικό φιλτράρισμα — μόνο όσα filters όντως δόθηκαν
    if (theatreId) {
      query += ' AND s.theatre_id = ?';
      params.push(theatreId);
    }
    if (title) {
      query += ' AND s.title LIKE ?';
      params.push(`%${title}%`); // partial match
    }
    if (date) {
      // EXISTS subquery: επιστρέφει shows που έχουν τουλάχιστον 1
      // showtime τη συγκεκριμένη ημερομηνία
      query += ' AND EXISTS (SELECT 1 FROM showtimes st WHERE st.show_id = s.show_id AND st.date = ?)';
      params.push(date);
    }

    const [shows] = await pool.query(query, params);
    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/shows/:id
// Λεπτομέρειες μιας παράστασης + στοιχεία θεάτρου της.
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// GET /api/shows/:id/showtimes
// Όλα τα προγραμματισμένα showtimes μιας παράστασης,
// ταξινομημένα χρονολογικά. Ο client το χρησιμοποιεί στο
// ShowDetailScreen για να εμφανίσει επιλογές ημερομηνίας/ώρας.
// ─────────────────────────────────────────────────────────────
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
