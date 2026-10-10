import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, inrFormatter } from './currency.js';

test('formatINR formats standard amounts with Indian digit grouping and symbol', () => {
  assert.equal(formatINR(15000), '₹15,000.00');
  assert.equal(formatINR(125000), '₹1,25,000.00');
  assert.equal(formatINR(750000), '₹7,50,000.00');
});

test('formatINR formats lakhs and crores correctly with en-IN grouping', () => {
  assert.equal(formatINR(100000), '₹1,00,000.00');
  assert.equal(formatINR(10000000), '₹1,00,00,000.00');
  assert.equal(formatINR(4500), '₹4,500.00');
  assert.equal(formatINR(2500), '₹2,500.00');
  assert.equal(formatINR(500), '₹500.00');
});

test('formatINR handles decimals and fractions correctly', () => {
  assert.equal(formatINR(4500.5), '₹4,500.50');
  assert.equal(formatINR(4500.75), '₹4,500.75');
  assert.equal(formatINR(4500.999), '₹4,501.00');
});

test('formatINR handles zero and string inputs', () => {
  assert.equal(formatINR(0), '₹0.00');
  assert.equal(formatINR('15000'), '₹15,000.00');
  assert.equal(formatINR('125000.50'), '₹1,25,000.50');
});

test('formatINR handles null, undefined, empty string and NaN gracefully', () => {
  assert.equal(formatINR(null), '₹0.00');
  assert.equal(formatINR(undefined), '₹0.00');
  assert.equal(formatINR(''), '₹0.00');
  assert.equal(formatINR('invalid_num'), '₹0.00');
  assert.equal(formatINR(NaN), '₹0.00');
});

test('formatINR respects custom fallback options', () => {
  assert.equal(formatINR(null, { fallback: 'N/A' }), 'N/A');
  assert.equal(formatINR(undefined, { fallback: '-' }), '-');
  assert.equal(formatINR('bad', { fallback: '₹0.00' }), '₹0.00');
});

test('inrFormatter instance is configured for en-IN INR currency', () => {
  assert.equal(inrFormatter.resolvedOptions().currency, 'INR');
  assert.equal(inrFormatter.resolvedOptions().style, 'currency');
});
