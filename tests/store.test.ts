import { describe, expect, it, vi } from 'vitest';
import { decodeSnapshot, STORAGE_KEY } from '../src/store/persistence';
import { createStore } from '../src/store/store';
import { parseCard } from '../src/schema/card';

const defaults = () => [parseCard({ schemaVersion: 1, id: 'store-card', title: 'Original', image: { src: '/item.svg', alt: 'Item' }, price: 100 })];
function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return { get length() { return values.size; }, key: (n) => [...values.keys()][n] ?? null, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); }, clear: () => values.clear() };
}

describe('versioned persistence', () => {
  it('uses the specified key and validates v1 snapshots', () => {
    expect(STORAGE_KEY).toBe('merchant-card-showroom:v1');
    const snapshot = { version: 1, cards: defaults(), selectedId: 'store-card', updatedAt: 123 };
    expect(decodeSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
  });
  it('migrates the documented demonstration v0 format', () => {
    const result = decodeSnapshot(JSON.stringify({ version: 0, products: defaults(), selectedId: 'store-card' }));
    expect(result.version).toBe(1);
    expect(result.cards).toEqual(defaults());
    expect(result.selectedId).toBe('store-card');
    expect(Number.isFinite(result.updatedAt)).toBe(true);
  });
  it.each(['{', 'null', '{}', JSON.stringify({ version: 2, cards: defaults() }), JSON.stringify({ version: 1, cards: [{ ...defaults()[0], price: -1 }], selectedId: 'store-card', updatedAt: 1 }), JSON.stringify({ version: 1, cards: [...defaults(), ...defaults()], selectedId: 'store-card', updatedAt: 1 })])('rejects malformed or unsupported snapshot %s', (raw) => {
    expect(() => decodeSnapshot(raw)).toThrow();
  });
});

describe('external storage events', () => {
  function setup() {
    const storage = memoryStorage();
    const write = vi.spyOn(storage, 'setItem');
    const remove = vi.spyOn(storage, 'removeItem');
    const target = new EventTarget();
    const detach = vi.spyOn(target, 'removeEventListener');
    const store = createStore(defaults(), { storage, eventTarget: target as unknown as Window });
    const notifications: string[] = [];
    store.subscribe((_state, source) => notifications.push(source));
    const emit = (key: string | null, newValue: string | null) => {
      const event = new Event('storage');
      Object.defineProperties(event, { key: { value: key }, newValue: { value: newValue }, storageArea: { value: storage } });
      target.dispatchEvent(event);
    };
    const external = JSON.stringify({ version: 1, cards: [{ ...defaults()[0], title: 'External' }], selectedId: 'store-card', updatedAt: 123 });
    return { store, write, remove, detach, emit, notifications, external };
  }
  it('accepts a valid external snapshot without writing it back', () => {
    const s = setup(); s.emit(STORAGE_KEY, s.external);
    expect(s.store.getState().cards[0].title).toBe('External');
    expect(s.notifications).toEqual(['external']);
    expect(s.write).not.toHaveBeenCalled(); expect(s.remove).not.toHaveBeenCalled();
    s.store.destroy();
  });
  it('ignores unrelated keys and preserves accepted state when an external snapshot is invalid', () => {
    const s = setup(); s.emit('other-app', s.external);
    expect(s.store.getState().cards[0].title).toBe('Original'); expect(s.notifications).toEqual([]);
    s.emit(STORAGE_KEY, s.external); s.emit(STORAGE_KEY, '{broken');
    expect(s.store.getState().cards[0].title).toBe('External');
    expect(s.store.getStatus().kind).toBe('error');
    expect(s.write).not.toHaveBeenCalled(); expect(s.remove).not.toHaveBeenCalled();
    s.store.destroy();
  });
  it.each([STORAGE_KEY, null])('restores defaults on remove/clear event %s without a write loop', (key) => {
    const s = setup(); s.emit(STORAGE_KEY, s.external); s.emit(key, null);
    expect(s.store.getState().cards).toEqual(defaults());
    expect(s.notifications).toEqual(['external', 'external']);
    expect(s.write).not.toHaveBeenCalled(); expect(s.remove).not.toHaveBeenCalled();
    s.store.destroy();
  });
  it('destroy removes the storage listener and stops subscriptions', () => {
    const s = setup(); s.store.destroy(); s.store.destroy(); s.emit(STORAGE_KEY, s.external);
    expect(s.detach).toHaveBeenCalledWith('storage', expect.any(Function));
    expect(s.detach).toHaveBeenCalledTimes(1);
    expect(s.store.getState().cards[0].title).toBe('Original');
    expect(s.notifications).toEqual([]); expect(s.write).not.toHaveBeenCalled();
  });
});

describe('store state and storage failures', () => {
  it('returns independent state snapshots and persists valid updates', () => {
    const storage = memoryStorage();
    const store = createStore(defaults(), { storage });
    const first = store.getState(); first.cards[0].title = 'External mutation';
    expect(store.getState().cards[0].title).toBe('Original');
    store.update({ ...defaults()[0], title: 'Accepted' });
    expect(store.getState().cards[0].title).toBe('Accepted');
    expect(decodeSnapshot(storage.getItem(STORAGE_KEY)!).cards[0].title).toBe('Accepted');
    expect(store.getStatus().kind).toBe('saved');
    store.destroy();
  });
  it('hydrates saved data instead of overriding it with defaults', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, cards: [{ ...defaults()[0], title: 'Saved' }], selectedId: 'store-card', updatedAt: 1 }));
    const store = createStore(defaults(), { storage });
    expect(store.getState().cards[0].title).toBe('Saved');
    store.destroy();
  });
  it('invalid update cannot corrupt accepted state or persisted data', () => {
    const storage = memoryStorage(); const store = createStore(defaults(), { storage });
    store.update(defaults()[0]); const before = storage.getItem(STORAGE_KEY);
    expect(() => store.update({ ...defaults()[0], price: -1 })).toThrow();
    expect(store.getState().cards[0].price).toBe(100);
    expect(storage.getItem(STORAGE_KEY)).toBe(before);
    store.destroy();
  });
  it('corrupt stored data falls back without silently overwriting the original', () => {
    const storage = memoryStorage(); storage.setItem(STORAGE_KEY, '{broken');
    const store = createStore(defaults(), { storage });
    expect(store.getState().cards).toEqual(defaults());
    expect(storage.getItem(STORAGE_KEY)).toBe('{broken');
    expect(store.getStatus().kind).not.toBe('saved');
    expect(store.getStatus().message).not.toBe('');
    store.destroy();
  });
  it('denied storage reads and writes preserve in-memory operation with visible failure status', () => {
    const storage = memoryStorage();
    storage.getItem = () => { throw new Error('Access denied'); };
    storage.setItem = () => { throw new Error('Access denied'); };
    const store = createStore(defaults(), { storage });
    store.update({ ...defaults()[0], title: 'Memory edit' });
    expect(store.getState().cards[0].title).toBe('Memory edit');
    expect(store.getStatus().kind).not.toBe('saved');
    expect(store.getStatus().message).not.toBe('');
    store.destroy();
  });
  it('quota failures do not pretend the update was saved', () => {
    const storage = memoryStorage(); storage.setItem = () => { throw new Error('QuotaExceededError'); };
    const store = createStore(defaults(), { storage });
    store.update({ ...defaults()[0], price: 149 });
    expect(store.getState().cards[0].price).toBe(149);
    expect(store.getStatus().kind).not.toBe('saved');
    store.destroy();
  });
  it('reset restores defaults and leaves unrelated storage untouched', () => {
    const storage = memoryStorage(); storage.setItem('unrelated-app', 'keep');
    const store = createStore(defaults(), { storage }); const sources: string[] = [];
    store.subscribe((_state, source) => sources.push(source));
    store.update({ ...defaults()[0], title: 'Edited' }); store.reset();
    expect(store.getState().cards).toEqual(defaults());
    expect(storage.getItem('unrelated-app')).toBe('keep');
    expect(sources).toContain('local'); expect(sources).toContain('reset');
    store.destroy();
  });
});
