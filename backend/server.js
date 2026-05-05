// ============================================================
//  CN6035 — Theatre Reservation API
//  Entry point του backend (Node.js + Express)
// ============================================================
//
//  Φορτώνει τα environment variables από το .env, στήνει τους
//  middlewares (CORS + JSON body parser) και mountάρει όλα τα
//  routers κάτω από το prefix /api.
//
//  Παράγει ένα JSON REST API που καταναλώνει το React Native
//  frontend. Τρέχει στο Railway (production) ή τοπικά για dev.
// ============================================================

require('dotenv').config(); // Φόρτωση μεταβλητών περιβάλλοντος (.env)

const express = require('express');
const cors = require('cors');

// ── Routers ─────────────────────────────────────────────────
// Κάθε router χειρίζεται ένα συγκεκριμένο "domain" του API:
const authRoutes = require('./src/routes/auth');               // /register, /login
const theatreRoutes = require('./src/routes/theatres');        // CRUD θεάτρων
const showRoutes = require('./src/routes/shows');              // παραστάσεις + showtimes
const seatRoutes = require('./src/routes/seats');              // διαθεσιμότητα θέσεων
const reservationRoutes = require('./src/routes/reservations');// κρατήσεις (CRUD)

const app = express();

// ── Middlewares ─────────────────────────────────────────────
// CORS: επιτρέπει στο mobile app (από οποιοδήποτε origin) να
//       καλέσει το API. Σε production θα μπορούσε να
//       περιοριστεί σε συγκεκριμένα origins.
app.use(cors());
// JSON parser: μετατρέπει το body των requests από JSON σε JS object.
app.use(express.json());

// ── Route mounting ──────────────────────────────────────────
// Auth routes (public): /api/register, /api/login
app.use('/api', authRoutes);

// Resource routes (mix public + JWT-protected — βλ. routers)
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/showtimes', seatRoutes);          // π.χ. /api/showtimes/:id/seats
app.use('/api/reservations', reservationRoutes); // POST/PUT/DELETE/GET κρατήσεων

// Alias: /api/user/reservations → ίδια handlers
// (η εκφώνηση αναφέρει και τα δύο paths ως ενδεικτικά endpoints)
app.use('/api/user', reservationRoutes);

// ── Health check ────────────────────────────────────────────
// Απαντάει σε GET / για να βεβαιωνόμαστε ότι το service ζει.
app.get('/', (req, res) => {
  res.json({ message: 'Theatre Reservation API is running' });
});

// ── Server start ────────────────────────────────────────────
// Στο Railway, το PORT δίνεται από το environment.
// Τοπικά defaults σε 3000.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
