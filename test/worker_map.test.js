const test = require('node:test');
const assert = require('node:assert');

const { WorkerMap } = require('../src/worker_map');

let map = null;

const values = {
  balance: 100,
  name: 'John',
  nameArmenian: 'Ջոն',
  lovesSport: true,
  numbers: [1, 2, 3, 4],
  details: {
    citizen: {
      country: 'Germany',
      passportYear: 1999,
    },
  },
};

test('Create a map structure', () => {
  map = new WorkerMap();
});

test('.set()', () => {
  Object.entries(values).forEach(([key, value]) => {
    const sameMap = map.set(key, value);
    assert.strictEqual(sameMap, map);
  });
});

test('.get()', () => {
  assert.strictEqual(map.get('balance'), 100);
  assert.strictEqual(map.get('name'), 'John');
  assert.strictEqual(map.get('nameArmenian'), 'Ջոն');
  assert.strictEqual(map.get('lovesSport'), true);
  assert.strictEqual(map.get('numbers').length, 4);
  assert.strictEqual(map.get('details').citizen.country, 'Germany');
});

test('.has', () => {
  assert.strictEqual(map.has('balance'), true);
  assert.strictEqual(map.has('name'), true);
  assert.strictEqual(map.has('nameLatin'), false);
  assert.strictEqual(map.has('text'), false);
  assert.strictEqual(map.has('numbers'), true);
});

test('.delete', () => {
  assert.strictEqual(map.delete('balance'), true);
  assert.strictEqual(map.has('balance'), false);

  assert.strictEqual(map.delete('account'), false);
});

test('.size', () => {
  assert.strictEqual(map.size(), 5);
});

test('.keys', () => {
  assert.strictEqual(map.keys().length, 5);
  assert.strictEqual(map.keys()[0], 'name');
});

test('.entries', () => {
  const entries = map.entries();

  entries.forEach(([key, value]) => {
    assert.deepEqual(values[key], value);
  });
});

test('.forEach', () => {
  map.forEach((key, value, sameMap) => {
    assert.deepEqual(values[key], value);
    assert.strictEqual(sameMap, map);
  });
});

test('.toSharedBuffer', () => {
  const sharedBuffer = map.toSharedBuffer();
  const sameMap = new WorkerMap(sharedBuffer);

  assert.strictEqual(sameMap.size(), 5);
});

test('.toObject', () => {
  const mapObject = map.toObject();

  Object.entries(mapObject).forEach(([key, value]) => {
    assert.deepEqual(values[key], value);
  });
});

test('.clear', () => {
  map.clear();
  assert.strictEqual(map.size(), 0);
});
