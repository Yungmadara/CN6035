// ============================================================
//  Auth Routes — Εγγραφή & Σύνδεση Χρηστών
// ============================================================
//
//  Παρέχει 2 public endpoints:
//   • POST /api/register — δημιουργία νέου λογαριασμού
//   • POST /api/login    — authentication και έκδοση JWT
//
//  Ασφάλεια:
//   - Passwords γίνονται hash με bcrypt (cost 10) πριν αποθηκευτούν
//   - JWT υπογράφεται με JWT_SECRET (env var) — διάρκεια 7 ημέρες
//   - Generic "Invalid credentials" στο login για να μη γίνεται
//     user enumeration
// ============================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────
// POST /api/register
// Body: { name, email, password }
// Response: 201 { message, userId } | 400/409/500 { message }
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Validation: όλα τα πεδία υποχρεωτικά
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  try {
    // Έλεγχος αν το email υπάρχει ήδη (UNIQUE constraint στη βάση
    // θα έπιανε ούτως ή άλλως, αλλά ο pre-check δίνει καθαρό error message)
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash με bcrypt (cost factor 10 = ~100ms work, ισορροπία ασφάλειας/UX)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert με parameterized query (προστασία από SQL injection)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/login
// Body: { email, password }
// Response: 200 { token, user } | 400/401/500 { message }
//
// Σε επιτυχία επιστρέφεται JWT που ο client αποθηκεύει στο
// expo-secure-store. Όλα τα protected requests στέλνουν τότε
// header "Authorization: Bearer <token>".
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    // Σκόπιμα ίδιο message για "δεν υπάρχει χρήστης" και "λάθος password"
    // → αποτρέπει user enumeration attacks
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    // bcrypt.compare συγκρίνει plaintext με hash σε constant time
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Δημιουργία JWT. Το payload περιέχει μόνο τα απαραίτητα στοιχεία
    // (όχι password!) — διαβάζεται από το authMiddleware ως req.user.
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Default: 7 ημέρες
    );

    res.json({ token, user: { id: user.user_id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
