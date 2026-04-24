// Usage: node database/import-to-railway.js "mysql://USER:PASSWORD@HOST:PORT/DB"
// Παίρνεις το URL από το Railway: MySQL service -> Variables -> MYSQL_PUBLIC_URL

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const PUBLIC_URL = process.argv[2] || process.env.MYSQL_PUBLIC_URL;

if (!PUBLIC_URL) {
  console.error('Missing MYSQL_PUBLIC_URL');
  console.error('Usage: node database/import-to-railway.js "mysql://USER:PASSWORD@HOST:PORT/DB"');
  process.exit(1);
}

async function main() {
  const sqlPath = path.join(__dirname, '..', 'database', 'railway-setup.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const url = new URL(PUBLIC_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port, 10) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1) || 'railway',
    multipleStatements: true,
  });

  console.log(`Connected to ${url.hostname}:${url.port}. Running setup SQL...`);
  await connection.query(sql);
  console.log('Import complete. Tables + seed data loaded.');
  await connection.end();
}

main().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
