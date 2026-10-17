import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, defaultData } from '../src/ui/storage.js';

function mockStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

test('save and load round-trip progress, coins and inventory', () => {
  const storage = createStorage(mockStorage());
  const data = defaultData();
  data.coins = 125;
  data.stars[3] = 2;
  data.inventory.undo = 4;
  data.settings.muted = true;
  data.endlessHigh = 12;
  storage.save(data);
  const loaded = storage.load();
  assert.equal(loaded.coins, 125);
  assert.equal(loaded.stars[3], 2);
  assert.equal(loaded.inventory.undo, 4);
  assert.equal(loaded.settings.muted, true);
  assert.equal(loaded.endlessHigh, 12);
});

test('corrupt save data falls back to defaults', () => {
  const backend = mockStorage();
  backend.setItem('frozen-catch-save-v1', '{not json');
  const storage = createStorage(backend);
  const loaded = storage.load();
  assert.deepEqual(loaded, defaultData());
});

test('missing save data returns defaults', () => {
  const storage = createStorage(mockStorage());
  assert.deepEqual(storage.load(), defaultData());
});
