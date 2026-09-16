import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildMessages, whenLabel } from '../scripts/notify.mjs';

const tesla = {
  id: 'heellife:12737755',
  title: 'Tesla x University of North Carolina, Chapel Hill | Supercharging Your Resume',
  start: '2026-09-16T21:00:00.000Z',
  virtual: true,
  campus: 'UNC',
  url: 'https://heellife.unc.edu/event/12737755',
  companies: ['Tesla'],
  reasons: ['Tesla', 'recruiters'],
};

test('times are shown in Eastern time', () => {
  assert.equal(whenLabel(tesla), 'Wed, Sep 16, 5:00 PM');
});

test('a single new event becomes one push that opens the listing', () => {
  const [msg] = buildMessages([tesla], 'topic-x');
  assert.equal(msg.topic, 'topic-x');
  assert.equal(msg.click, tesla.url);
  assert.match(msg.message, /Wed, Sep 16, 5:00 PM/);
  assert.match(msg.message, /Virtual/);
  assert.match(msg.message, /Why: Tesla, recruiters/);
  assert.equal(msg.priority, 5, 'employer events get the top priority');
});

test('a burst of new events collapses into one summary push', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ ...tesla, id: `x:${i}`, title: `Event ${i}` }));
  const msgs = buildMessages(many, 't');
  assert.equal(msgs.length, 1);
  assert.match(msgs[0].title, /^9 new high-value events$/);
  assert.match(msgs[0].message, /and 1 more/);
});

test('nothing new means no pushes', () => {
  assert.deepEqual(buildMessages([], 't'), []);
});

test('push text never contains an em or en dash', () => {
  const text = JSON.stringify(buildMessages([tesla], 't'));
  assert.equal(/[–—]/.test(text), false);
});
