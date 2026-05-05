// ============================================================
//  Database Connection Pool
// ============================================================
//
//  Δημιουργεί ένα MySQL connection pool που μοιράζεται από
//  όλα τα routes. Τα credentials διαβάζονται από env vars
//  (.env τοπικά, Railway Variables σε production).
//
//  Γιατί pool αντί για ξεχωριστό connection ανά request;
//  → Επαναχρησιμοποίηση συνδέσεων (γρήγορο, χαμηλό overhead)
//  → Προστασία από connection exhaustion στη βάση
//  → Built-in queueing όταν όλες οι συνδέσεις είναι busy
// ============================================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',           // Railway: mysql.railway.internal
  port: process.env.DB_PORT || 3306,                  // Default MySQL port
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'theatre_db',      // Railway: 'railway'
  waitForConnections: true,    // Αν δεν υπάρχει διαθέσιμη σύνδεση, περίμενε αντί να πετάξεις error
  connectionLimit: 10,         // Max ταυτόχρονες ενεργές συνδέσεις (κατάλληλο για demo/coursework)
});

module.exports = pool;
