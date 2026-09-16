#!/usr/bin/env node
// Pulls every source, dedupes, scores, and writes the site data plus the list of events worth a
// phone push. Runs in GitHub Actions every three hours.
//
// Design rules carried over from HeelSeek: one dead source never empties the site, a source that
// silently collapses is treated as failed, and failed sources are carried forward from the last
// good payload. The previous payload is read from the live site, so no data is committed to git.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as heellife from './sources/heellife.mjs';
import * as tribe from './sources/tribe.mjs';
import * as localist from './sources/localist.mjs';
import * as duke from './sources/duke.mjs';
import * as watch from './sources/watch.mjs';
import { dedupe, dedupeKey } from './lib/normalize.mjs';
import { scoreEvent } from './lib/score.mjs';
import { getJson } from './lib/fetch.mjs';
import { buildCalendar } from '../src/lib/ics.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/events.json');
const ICS_OUT = resolve(ROOT, 'public/data/high.ics');
const NOTIFY_OUT = resolve(ROOT, 'notify.json');

export const SITE_URL = 'https://neilp211.github.io/recruiter-radar/';
const PREV_URL = process.env.PREV_URL ?? `${SITE_URL}data/events.json`;

export const HORIZON_DAYS = 150;
export const ARCHIVE_DAYS = 365;
export const ARCHIVE_CAP = 300;
export const DROP_GUARD = 0.6;
export const MAX_STALE_DAYS = 45;
const DAY = 86_400_000;

const SOURCES = [
  { key: 'unccs', label: 'UNC Computer Science', home: tribe.SITES[1].home, run: () => tribe.fetchSite(tribe.SITES[1]) },
  { key: 'careerhub', label: 'UNC Career Hub', home: tribe.SITES[0].home, run: () => tribe.fetchSite(tribe.SITES[0]) },
  { key: 'heellife', label: 'Heel Life', home: heellife.meta.home, run: () => heellife.fetchEvents() },
  { key: 'localist', label: 'UNC Calendar', home: localist.SITES[0].home, run: () => localist.fetchSite(localist.SITES[0], { days: HORIZON_DAYS }) },
  { key: 'duke', label: 'Duke Calendar', home: duke.meta.home, run: () => duke.fetchEvents({ days: HORIZON_DAYS }) },
  { key: 'ncsu', label: 'NC State Calendar', home: localist.SITES[1].home, run: () => localist.fetchSite(localist.SITES[1], { days: HORIZON_DAYS }) },
  { key: 'watch', label: 'Company pages', home: watch.meta.home, run: () => watch.fetchEvents() },
];

async function runSource(source) {
  const started = Date.now();
  try {
    const events = await source.run();
    const ms = Date.now() - started;
    console.log(`  ok   ${source.key.padEnd(9)} ${String(events.length).padStart(5)} events  ${ms}ms`);
    return {
      events,
      status: { key: source.key, label: source.label, home: source.home, ok: true, count: events.length, ms, lastFetchedAt: new Date().toISOString() },
    };
  } catch (err) {
    console.error(`  FAIL ${source.key.padEnd(9)} ${err.message}`);
    return { events: [], status: { key: source.key, label: source.label, home: source.home, ok: false, count: 0, error: err.message } };
  }
}

/** A source that used to return plenty and now returns none or far fewer did not really empty. */
export function flagSilentDropouts(statuses, prev) {
  if (!prev?.sources) return;
  const before = new Map(prev.sources.map((s) => [s.key, s.count]));
  for (const s of statuses) {
    if (!s.ok) continue;
    const was = before.get(s.key) ?? 0;
    if (s.count === 0 && was > 5) {
      s.ok = false;
      s.error = `returned 0 events but had ${was} last run`;
    } else if (was >= 20 && s.count < was * DROP_GUARD) {
      s.ok = false;
      s.error = `returned ${s.count} events, down from ${was} last run`;
    }
  }
}

/** Reuse a failed source's still-future events from the last good payload, for a while. */
export function carryForwardFailed(statuses, prev, now) {
  if (!prev?.events?.length) return [];
  const prevStatus = new Map((prev.sources ?? []).map((s) => [s.key, s]));
  const rescued = [];
  for (const s of statuses) {
    if (s.ok) continue;
    const lastFetched = prevStatus.get(s.key)?.lastFetchedAt ?? prev.generatedAt;
    const ageDays = (now - new Date(lastFetched)) / DAY;
    if (!Number.isFinite(ageDays) || ageDays > MAX_STALE_DAYS) continue;
    const kept = prev.events.filter((e) => e.source === s.key && Date.parse(e.start) >= now.getTime());
    if (!kept.length) continue;
    rescued.push(...kept);
    s.stale = true;
    s.lastFetchedAt = lastFetched;
    s.staleAgeHours = Math.round(ageDays * 24);
  }
  return rescued;
}

export function withinHorizon(events, now) {
  const floor = now.getTime() - 12 * 3600_000;
  const ceil = now.getTime() + HORIZON_DAYS * DAY;
  return events.filter((e) => {
    const t = Date.parse(e.start);
    return Number.isFinite(t) && t >= floor && t <= ceil;
  });
}

/** Score and keep only what is worth showing. */
export function scoreAll(events) {
  const out = [];
  for (const ev of events) {
    const s = scoreEvent(ev);
    if (s.tier === 'drop') continue;
    out.push({ ...ev, tier: s.tier, score: s.score, kind: s.kind, companies: s.companies, reasons: s.reasons });
  }
  return out;
}

/**
 * High-value events that have already happened, so the site can show what was missed.
 * Built from the previous payload: anything high that is now in the past joins the archive.
 */
export function buildArchive(prev, now) {
  const floor = now.getTime() - ARCHIVE_DAYS * DAY;
  const cutoff = now.getTime() - 12 * 3600_000;
  const seen = new Map();
  const candidates = [
    ...(prev?.archive ?? []),
    ...(prev?.events ?? []).filter((e) => e.tier === 'high' && Date.parse(e.start) < cutoff),
  ];
  for (const e of candidates) {
    const t = Date.parse(e.start);
    if (!Number.isFinite(t) || t < floor || t >= cutoff) continue;
    seen.set(e.id, e);
  }
  return [...seen.values()].sort((a, b) => b.start.localeCompare(a.start)).slice(0, ARCHIVE_CAP);
}

/**
 * High-tier events that were not high-tier in the previous live payload. With no previous payload
 * (the very first run, or the site is unreachable) nothing is new: better to miss one push than to
 * flood a phone with every event on the calendar.
 */
export function newHighEvents(events, prev, now) {
  if (!prev?.events) return [];
  const known = new Set();
  const knownKeys = new Set();
  for (const e of [...prev.events, ...(prev.archive ?? [])]) {
    if (e.tier !== 'high') continue;
    known.add(e.id);
    knownKeys.add(dedupeKey(e));
  }
  return events.filter((e) =>
    e.tier === 'high' &&
    Date.parse(e.start) >= now.getTime() &&
    !known.has(e.id) &&
    !knownKeys.has(dedupeKey(e)));
}

async function previousRun() {
  try {
    const data = await getJson(PREV_URL, { retries: 1 });
    if (Array.isArray(data?.events)) {
      console.log(`previous payload: live site (${data.events.length} events, ${data.generatedAt})`);
      return data;
    }
  } catch (err) {
    console.log(`previous payload: live site unavailable (${err.message})`);
  }
  try {
    const data = JSON.parse(await readFile(OUT, 'utf8'));
    console.log('previous payload: local file');
    return data;
  } catch {
    console.log('previous payload: none, first run');
    return null;
  }
}

async function main() {
  const now = new Date();
  console.log(`Recruiter Radar ingest at ${now.toISOString()}`);
  const prev = await previousRun();

  const results = [];
  for (const source of SOURCES) results.push(await runSource(source));
  const statuses = results.map((r) => r.status);
  flagSilentDropouts(statuses, prev);

  const okCount = statuses.filter((s) => s.ok).length;
  if (okCount === 0) {
    console.error('every source failed, refusing to write');
    process.exit(1);
  }

  const fresh = scoreAll(dedupe(withinHorizon(results.flatMap((r) => r.events), now)));
  // Carried-over events were already scored last run; keep their tier as it was.
  const carried = carryForwardFailed(statuses, prev, now);
  const byKey = new Map();
  for (const e of [...carried, ...fresh]) byKey.set(dedupeKey(e), e);
  const events = [...byKey.values()].sort((a, b) => a.start.localeCompare(b.start));

  const archive = buildArchive(prev, now);
  const toNotify = newHighEvents(events, prev, now);

  const SHIP = ['id', 'source', 'alsoListed', 'campus', 'title', 'description', 'start', 'end', 'allDay', 'venue', 'org', 'url', 'virtual', 'tier', 'score', 'kind', 'companies', 'reasons'];
  const slim = (e) => Object.fromEntries(SHIP.filter((k) => e[k] !== null && e[k] !== undefined).map((k) => [k, e[k]]));

  const payload = {
    generatedAt: now.toISOString(),
    horizonDays: HORIZON_DAYS,
    counts: {
      high: events.filter((e) => e.tier === 'high').length,
      medium: events.filter((e) => e.tier === 'medium').length,
      scanned: results.reduce((n, r) => n + r.events.length, 0),
      archive: archive.length,
    },
    sources: statuses,
    events: events.map(slim),
    archive: archive.map(slim),
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
  await writeFile(ICS_OUT, buildCalendar(events.filter((e) => e.tier === 'high'), { name: 'Recruiter Radar: high value', stamp: now.toISOString() }));
  await writeFile(NOTIFY_OUT, JSON.stringify(toNotify.map(slim), null, 1));

  console.log(
    `\nscanned ${payload.counts.scanned} events from ${okCount}/${SOURCES.length} sources: ` +
    `${payload.counts.high} high, ${payload.counts.medium} worth a look, ${archive.length} archived, ` +
    `${toNotify.length} new high for push`,
  );
  for (const e of events.filter((x) => x.tier === 'high')) {
    console.log(`  HIGH ${e.start.slice(0, 10)} ${e.campus.padEnd(8)} ${e.title.slice(0, 70)}  [${e.reasons.join(', ')}]`);
  }
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
