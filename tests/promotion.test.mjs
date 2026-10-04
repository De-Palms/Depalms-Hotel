import assert from 'node:assert/strict';
import test from 'node:test';
import { responsePayload, selectPromotion } from '../functions/api/promotion.js';

const headers = [
  'ID', 'Active', 'Label', 'Title', 'Description', 'Details', 'Price', 'Old Price',
  'Currency', 'Button Text', 'Button Link', 'Start Date', 'End Date', 'Priority', 'Created At',
];

test('selects the active promotion with the lowest priority number', () => {
  const selected = selectPromotion([
    headers,
    ['EXPIRED', true, 'OFFER', 'Expired', 'Past offer', '', 50000, '', '₦', 'Book', 'https://example.com', '2026-10-01', '2026-10-09', 1, '2026-10-01'],
    ['FUTURE', true, 'OFFER', 'Future', 'Future offer', '', 50000, '', '₦', 'Book', 'https://example.com', '2026-10-11', '2026-10-12', 1, '2026-10-01'],
    ['INACTIVE', false, 'OFFER', 'Inactive', 'Inactive offer', '', 50000, '', '₦', 'Book', 'https://example.com', '2026-10-01', '2026-10-12', 1, '2026-10-01'],
    ['PACKAGE', true, 'SPECIAL OFFER', 'Weekend Escape', 'A relaxing stay.', '', 120000, 150000, '₦', 'Book now', 'https://example.com', '2026-10-01', '2026-10-12', 3, '2026-10-01'],
    ['EVENT', true, 'THIS WEEKEND', 'Sunset Soirée', 'Music and cocktails.', 'Saturday · 7 PM · Rooftop', '', '', '₦', 'Reserve a table', 'https://example.com', '2026-10-01', '2026-10-12', 1, '2026-10-02'],
  ], '2026-10-10');

  assert.equal(selected.id, 'EVENT');
});

test('returns no promotion when every row is outside its active period', () => {
  const selected = selectPromotion([
    headers,
    ['PAST', true, 'OFFER', 'Past', 'Past offer', '', '', '', '₦', '', '', '2026-10-01', '2026-10-02', 1, '2026-10-01'],
    ['FUTURE', true, 'OFFER', 'Future', 'Future offer', '', '', '', '₦', '', '', '2026-10-12', '2026-10-13', 1, '2026-10-01'],
  ], '2026-10-10');

  assert.equal(selected, null);
});

test('formats optional pricing and removes an unsafe CTA destination', () => {
  const payload = responsePayload({
    label: 'SPECIAL OFFER',
    title: 'Weekend Escape',
    description: 'A relaxing stay.',
    details: '',
    price: 120000,
    oldprice: 150000,
    currency: '₦',
    buttontext: 'Book now',
    buttonlink: 'javascript:alert(1)',
  });

  assert.deepEqual(payload, {
    active: true,
    promotion: {
      label: 'SPECIAL OFFER',
      title: 'Weekend Escape',
      description: 'A relaxing stay.',
      details: '',
      price: '₦120,000',
      oldPrice: '₦150,000',
      buttonText: '',
      buttonLink: '',
    },
  });
});
