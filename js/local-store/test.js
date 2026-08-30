'use strict';
const test = require('node:test');
const assert = require('assert');

function fakeLocalStorage(overrides) {
  const data = {};
  return Object.assign({
    getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data
  }, overrides);
}

test('get/set round-trips a value through JSON', () => {
  global.localStorage = fakeLocalStorage();
  const LocalStore = require('./local-store.js');
  const store = LocalStore('app:');
  assert.strictEqual(store.set('a', { n: 1 }), true);
  assert.deepStrictEqual(store.get('a', null), { n: 1 });
});

test('get returns the default when the key is unset', () => {
  global.localStorage = fakeLocalStorage();
  delete require.cache[require.resolve('./local-store.js')];
  const LocalStore = require('./local-store.js');
  const store = LocalStore('app:');
  assert.strictEqual(store.get('missing', 'fallback'), 'fallback');
});

test('keys are namespaced by the given prefix', () => {
  global.localStorage = fakeLocalStorage();
  delete require.cache[require.resolve('./local-store.js')];
  const LocalStore = require('./local-store.js');
  const storeA = LocalStore('a:');
  const storeB = LocalStore('b:');
  storeA.set('key', 'from-a');
  storeB.set('key', 'from-b');
  assert.strictEqual(storeA.get('key'), 'from-a');
  assert.strictEqual(storeB.get('key'), 'from-b');
  assert.strictEqual(global.localStorage._data['a:key'], JSON.stringify('from-a'));
});

test('a blocked/throwing store degrades to the default instead of throwing', () => {
  global.localStorage = fakeLocalStorage({
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); }
  });
  delete require.cache[require.resolve('./local-store.js')];
  const LocalStore = require('./local-store.js');
  const store = LocalStore('app:');
  assert.strictEqual(store.set('a', 1), false);
  assert.strictEqual(store.get('a', 'default'), 'default');
});

test('unparsable stored JSON degrades to the default instead of throwing', () => {
  global.localStorage = fakeLocalStorage();
  global.localStorage.setItem('app:bad', 'not json');
  delete require.cache[require.resolve('./local-store.js')];
  const LocalStore = require('./local-store.js');
  const store = LocalStore('app:');
  assert.strictEqual(store.get('bad', 'default'), 'default');
});
