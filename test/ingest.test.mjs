import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newHighEvents, buildArchive, flagSilentDropouts, carryForwardFailed, scoreAll, withinHorizon } from '../scripts/ingest.mjs';

const NOW = new Date('2026-09-16T12:00:00Z');
const DAY = 86_400_000;
const at = (days) => new Date(NOW.getTime() + days * DAY).toISOString();
const E = (id, tier, days, title = id) => ({ id, source: id.split(':')[0], title, start: at(days), tier });

test('no previous payload means nothing is pushed, so a first run cannot flood the phone', () => {
  assert.deepEqual(newHighEvents([E('heellife:1', 'high', 2)], null, NOW), []);
});

test('only high events that were not already high are pushed', () => {
  const prev = { events: [E('heellife:1', 'high', 2), E('heellife:2', 'medium', 3)], archive: [] };
  const current = [E('heellife:1', 'high', 2), E('heellife:2', 'high', 3), E('heellife:3', 'high', 4), E('heellife:4', 'medium', 5)];
  assert.deepEqual(newHighEvents(current, prev, NOW).map((e) => e.id), ['heellife:2', 'heellife:3']);
});

test('an event that moved to a different source id is not pushed twice', () => {
  const prev = { events: [E('heellife:1', 'high', 2, 'Tesla Resume Workshop')] };
  const current = [{ ...E('careerhub:9', 'high', 2, 'Tesla Resume Workshop') }];
  assert.deepEqual(newHighEvents(current, prev, NOW), []);
});

test('past events are never pushed', () => {
  const prev = { events: [] };
  assert.deepEqual(newHighEvents([E('heellife:1', 'high', -1)], prev, NOW), []);
});

test('high events that have passed move into the archive, newest first', () => {
  const prev = {
    events: [E('heellife:1', 'high', -2), E('heellife:2', 'medium', -2), E('heellife:3', 'high', 3)],
    archive: [E('heellife:0', 'high', -40), E('heellife:old', 'high', -400)],
  };
  assert.deepEqual(buildArchive(prev, NOW).map((e) => e.id), ['heellife:1', 'heellife:0']);
});

test('a source that collapses is marked failed', () => {
  const statuses = [{ key: 'heellife', ok: true, count: 0 }, { key: 'duke', ok: true, count: 300 }];
  flagSilentDropouts(statuses, { sources: [{ key: 'heellife', count: 900 }, { key: 'duke', count: 1200 }] });
  assert.equal(statuses[0].ok, false);
  assert.equal(statuses[1].ok, false);
  assert.match(statuses[1].error, /down from 1200/);
});

test('a failed source is carried forward from the last payload while it is fresh', () => {
  const statuses = [{ key: 'duke', ok: false, count: 0 }];
  const prev = {
    generatedAt: at(-0.2),
    sources: [{ key: 'duke', lastFetchedAt: at(-1) }],
    events: [E('duke:1', 'high', 2), E('duke:2', 'medium', -1), E('ncsu:1', 'high', 2)],
  };
  assert.deepEqual(carryForwardFailed(statuses, prev, NOW).map((e) => e.id), ['duke:1']);
  assert.equal(statuses[0].stale, true);
});

test('scoreAll keeps high and medium and drops the rest', () => {
  const events = [
    { id: 'a', source: 'heellife', title: 'LIFT x UNC Chapel Hill: Connect with Cisco', description: '', org: 'UNC Career Center', start: at(1) },
    { id: 'b', source: 'heellife', title: 'Fall Opera Scenes', description: '', org: 'Department of Music', start: at(1) },
  ];
  const kept = scoreAll(events);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].tier, 'high');
  assert.deepEqual(kept[0].companies, ['Cisco']);
});

test('the horizon keeps today and drops the far future', () => {
  const events = [{ start: at(-0.25) }, { start: at(10) }, { start: at(400) }, { start: 'bad' }];
  assert.equal(withinHorizon(events, NOW).length, 2);
});
