// ============================================================
//  Pricing Utilities — Frontend (mirror του backend)
// ============================================================
//
//  Παρέχει στις screens γρήγορο, client-side υπολογισμό τιμών
//  ώστε να εμφανίζεται live preview χωρίς να κάνουμε round-trip
//  στο API καθώς ο user επιλέγει θέσεις.
//
//  ΣΗΜΑΝΤΙΚΟ: η τελική ΑΥΘΕΝΤΙΚΗ τιμή υπολογίζεται από το
//  backend πριν την κράτηση (server-side authority). Αυτές οι
//  συναρτήσεις είναι ΜΟΝΟ για visual feedback.
//
//  Πρέπει να είναι ΠΑΝΤΑ συγχρονισμένο με
//  backend/src/utils/pricing.js — ίδιοι multipliers.
// ============================================================

// Πολλαπλασιαστές — ίδιοι με backend
export const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,       // +50% έναντι Standard
  Standard: 1.0,  // base price του showtime
  Economy: 0.6,   // -40% έναντι Standard
};

/**
 * Υπολογίζει τιμή θέσης βάσει κατηγορίας.
 * Προστατεύεται από non-numeric basePrice με parseFloat (|| 0).
 */
export function seatPrice(basePrice, category) {
  const base = parseFloat(basePrice) || 0;            // safe parse
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0; // unknown cat → 1.0
  return Math.round(base * mult * 100) / 100;         // 2 δεκαδικά
}

/**
 * Διαμορφώνει αριθμό ως string ευρώ, π.χ. 75 → "€75.00"
 */
export function formatEuro(amount) {
  return `€${amount.toFixed(2)}`;
}
