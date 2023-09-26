const test = require('node:test');
const assert = require('node:assert');

const { WorkerMap } = require('../src/worker_map');

let map = null;

test('Create a map structure', () => {
    map = new WorkerMap();
});

test('.set()', () => {
    map.set('balance', 100);
    map.set('name', 'John');
    map.set('nameArmenian', 'Ջոն');
    map.set('lovesSport', true);
    map.set('numbers', [ 1, 2, 3, 4]);
    map.set('details', {
        citizen: {
            country: 'Germany',
            passportYear: 1999,
        }
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

test('.toSharedBuffer', () => {
    const sharedBuffer = map.toSharedBuffer();
    const sameMap = new WorkerMap(sharedBuffer);

    assert.strictEqual(sameMap.size(), 5);
});

test('.toObject', () => {
    const mapObject = map.toObject();

    assert.strictEqual(mapObject.details.citizen.passportYear, 1999);
    assert.strictEqual(Object.keys(mapObject).length, 5);
});
