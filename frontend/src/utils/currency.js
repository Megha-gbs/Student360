/**
 * Shared currency formatting utility for Indian Rupees (INR).
 * Configured according to the en-IN locale with Indian numbering system (Lakhs/Crores).
 */
export const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric amount or string into Indian Rupee (INR) currency format.
 * Examples:
 *   15000 -> ₹15,000.00
 *   125000 -> ₹1,25,000.00
 *   750000 -> ₹7,50,000.00
 *
 * @param {number|string|null|undefined} amount - The numeric amount to format
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.fallback='₹0.00'] - Fallback string for null/undefined/invalid values
 * @returns {string} Formatted INR currency string
 */
export function formatINR(amount, { fallback = '₹0.00' } = {}) {
  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }
  const numericVal = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isNaN(numericVal)) {
    return fallback;
  }
  return inrFormatter.format(numericVal);
}

export default formatINR;
