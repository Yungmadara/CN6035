// Category multipliers mirror backend/src/utils/pricing.js
export const CATEGORY_MULTIPLIERS = {
  VIP: 1.5,
  Standard: 1.0,
  Economy: 0.6,
};

export function seatPrice(basePrice, category) {
  const base = parseFloat(basePrice) || 0;
  const mult = CATEGORY_MULTIPLIERS[category] ?? 1.0;
  return Math.round(base * mult * 100) / 100;
}

export function formatEuro(amount) {
  return `€${amount.toFixed(2)}`;
}
