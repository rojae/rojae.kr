import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');

function setup() {
  const details = [{ open: false }, { open: true }];
  const events = new Map();
  vm.runInNewContext(script, {
    window: { addEventListener: (name, handler) => events.set(name, handler) },
    document: {
      querySelector: () => null,
      querySelectorAll: selector => selector.includes(':not([open])') ? details.filter(item => !item.open) : [],
    },
  });
  return { details, dispatch: name => events.get(name)() };
}

test('printing expands hidden history and restores the previous screen state', () => {
  const { details, dispatch } = setup();
  dispatch('beforeprint');
  assert(details.every(item => item.open));
  dispatch('afterprint');
  assert.deepEqual(details.map(item => item.open), [false, true]);
});

test('repeated beforeprint events do not overwrite the original state', () => {
  const { details, dispatch } = setup();
  dispatch('beforeprint');
  dispatch('beforeprint');
  dispatch('afterprint');
  assert.deepEqual(details.map(item => item.open), [false, true]);
});

test('subsequent print sessions capture the newly selected disclosure state', () => {
  const { details, dispatch } = setup();
  dispatch('beforeprint');
  dispatch('afterprint');
  details[0].open = true;
  details[1].open = false;
  dispatch('beforeprint');
  dispatch('afterprint');
  assert.deepEqual(details.map(item => item.open), [true, false]);
});
