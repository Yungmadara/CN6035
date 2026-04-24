// Category multipliers applied to showtime.price (base = Standard)
const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,
  Standard: 1.0,
  Economy: 0.6,
};

function seatPrice(basePrice, category) {
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(basePrice * mult * 100) / 100;
}

function generateReference() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = require('crypto').randomBytes(3).toString('hex').toUpperCase();
  return `BK-${y}${m}${day}-${rand}`;
}

Object.freeze(CATEGORY_MULTIPLIERS);
module.exports = { CATEGORY_MULTIPLIERS, seatPrice, generateReference };
