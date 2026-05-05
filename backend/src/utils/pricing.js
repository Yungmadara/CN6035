// ============================================================
//  Pricing Utilities — Backend
// ============================================================
//
//  Παρέχει:
//   1) CATEGORY_MULTIPLIERS — οι πολλαπλασιαστές τιμών ανά
//      κατηγορία θέσης (VIP / Standard / Economy)
//   2) seatPrice(base, cat) — υπολογίζει τελική τιμή θέσης
//   3) generateReference() — δημιουργεί μοναδικό booking code
//
//  Σημαντικό: η τιμή υπολογίζεται **server-side** ώστε να μην
//  μπορεί ο client να υποβάλει "πειραγμένη" τιμή. Το ίδιο
//  module υπάρχει και στο frontend (utils/pricing.js) για να
//  δείχνει live preview στο UI πριν την κράτηση.
// ============================================================

// Πολλαπλασιαστές βάσει της base price του showtime.
// Standard = 1.0 (η τιμή του showtime είναι "Standard price").
// VIP κοστίζει +50%, Economy -40%.
const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,
  Standard: 1.0,
  Economy: 0.6,
};

/**
 * Υπολογίζει την τιμή μιας θέσης συγκεκριμένης κατηγορίας.
 * @param {number} basePrice — η τιμή του showtime (Standard)
 * @param {string} category  — 'VIP' | 'Standard' | 'Economy'
 * @returns {number}         — τιμή σε ευρώ, στρογγυλοποιημένη στα 2 δεκαδικά
 */
function seatPrice(basePrice, category) {
  // Αν η κατηγορία δεν αναγνωρίζεται, default σε 1.0 (αντί για NaN/crash).
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  // Στρογγυλοποίηση 2 δεκαδικών για να αποφύγουμε floating-point drift
  // (π.χ. 25 * 0.6 = 14.999999... → 15.00).
  return Math.round(basePrice * mult * 100) / 100;
}

/**
 * Δημιουργεί μοναδικό κωδικό booking, π.χ. "BK-20260424-A7F3C2".
 * Format: BK-{YYYYMMDD}-{6 random hex chars}
 *
 * Χρησιμοποιεί crypto.randomBytes (όχι Math.random) για
 * cryptographic-grade τυχαιότητα → ~16.7M μοναδικά IDs/ημέρα,
 * πρακτικά μηδενική πιθανότητα collision για demo workloads.
 */
function generateReference() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0'); // Zero-padded μήνα (01-12)
  const day = String(d.getDate()).padStart(2, '0');    // Zero-padded ημέρα (01-31)
  // 3 bytes → 6 hex chars (uppercase για readability)
  const rand = require('crypto').randomBytes(3).toString('hex').toUpperCase();
  return `BK-${y}${m}${day}-${rand}`;
}

// Frozen ώστε κανείς να μην μπορεί κατά λάθος να αλλάξει
// τους multipliers σε runtime (π.χ. CATEGORY_MULTIPLIERS.VIP = 99).
Object.freeze(CATEGORY_MULTIPLIERS);

module.exports = { CATEGORY_MULTIPLIERS, seatPrice, generateReference };
