import { describe, expect, it } from 'vitest';
import { parseCard } from '../src/schema/card';
import { formatPrice, hasOriginalPrice, savingsPercent } from '../src/core/pricing';

const valid = () => ({ schemaVersion: 1, id: 'qa-card', title: '測試商品', image: { src: '/assets/test.svg', alt: '測試商品圖片' }, price: 9500 });

describe('Card v1 contract', () => {
  it('accepts minimum data and supplies documented defaults without mutating input', () => {
    const input = valid();
    const result = parseCard(input);
    expect(result.variant).toBe('ranking');
    expect(result.badges).toEqual([]);
    expect(input).not.toHaveProperty('variant');
    result.image.alt = 'changed';
    expect(input.image.alt).toBe('測試商品圖片');
  });
  it.each(['id', 'title', 'image', 'price', 'schemaVersion'])('rejects missing %s', (field) => {
    const input: Record<string, unknown> = valid();
    delete input[field];
    expect(() => parseCard(input)).toThrow();
  });
  it.each([null, undefined, [], 'card', { ...valid(), schemaVersion: 2 }, { ...valid(), id: ' ' }, { ...valid(), title: ' ' }, { ...valid(), title: '字'.repeat(201) }, { ...valid(), variant: 'unknown' }])('rejects invalid record %j', (input) => {
    expect(() => parseCard(input)).toThrow();
  });
  it.each([-1, 1.5, NaN, Infinity, '9500', ''])('rejects invalid price %s', (price) => {
    expect(() => parseCard({ ...valid(), price })).toThrow();
  });
  it('distinguishes zero from absent values', () => {
    const card = parseCard({ ...valid(), price: 0, originalPrice: 0, stock: 0 });
    expect(card.price).toBe(0);
    expect(card.stock).toBe(0);
    expect(hasOriginalPrice(card)).toBe(true);
  });
  it.each([-1, 0.5, Infinity])('rejects invalid stock and originalPrice %s', (value) => {
    expect(() => parseCard({ ...valid(), stock: value })).toThrow();
    expect(() => parseCard({ ...valid(), originalPrice: value })).toThrow();
  });
  it('normalizes optional whitespace and supports both built-in variants', () => {
    const card = parseCard({ ...valid(), tagline: '  ', productUrl: ' ', videoUrl: '', variant: 'flash-sale' });
    expect(card.tagline).toBeUndefined();
    expect(card.productUrl).toBeUndefined();
    expect(card.videoUrl).toBeUndefined();
    expect(card.variant).toBe('flash-sale');
  });
  it.each(['https://example.com/item', 'http://example.com/item', './item', '/item'])('accepts safe URL %s', (url) => {
    expect(parseCard({ ...valid(), productUrl: url, videoUrl: url, image: { src: url, alt: 'image' } })).toBeDefined();
  });
  it.each(['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///tmp/test'])('rejects unsafe URL %s in all URL fields', (url) => {
    expect(() => parseCard({ ...valid(), productUrl: url })).toThrow();
    expect(() => parseCard({ ...valid(), videoUrl: url })).toThrow();
    expect(() => parseCard({ ...valid(), image: { src: url, alt: 'image' } })).toThrow();
  });
});

describe('pricing without misleading discounts', () => {
  it('formats TWD integer prices', () => {
    expect(formatPrice(43900)).toBe('$43,900');
    expect(formatPrice(0)).toBe('$0');
  });
  it.each([9500, 9000, 0])('keeps provided original price %s even when no savings exist', (originalPrice) => {
    const card = parseCard({ ...valid(), originalPrice });
    expect(hasOriginalPrice(card)).toBe(true);
    expect(savingsPercent(card.price, originalPrice)).toBeUndefined();
  });
  it('hides only absent original price', () => {
    expect(hasOriginalPrice(parseCard(valid()))).toBe(false);
    expect(savingsPercent(9500)).toBeUndefined();
  });
  it('rounds positive savings using the documented formula', () => {
    expect(savingsPercent(899, 1914)).toBe(53);
    expect(savingsPercent(0, 100)).toBe(100);
  });
});
