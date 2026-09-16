// The one event shape every adapter produces, plus cross-source dedupe.

import { clean, cleanLine } from './text.mjs';

export const CAMPUS_BY_SOURCE = {
  heellife: 'UNC', careerhub: 'UNC', unccs: 'UNC', localist: 'UNC',
  duke: 'Duke', ncsu: 'NC State', watch: 'Company',
};

const VIRTUAL = /\bvirtual\b|\bonline\b|\bzoom\b|\bwebinar\b|\bmicrosoft teams\b|\bgoogle meet\b|\bwebex\b|\blivestream\b/i;

export function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Adapters pass raw-ish fields; cleaning and validation live here only. */
export function makeEvent(raw) {
  const start = toIso(raw.start);
  if (!start) return null;
  const title = cleanLine(raw.title, 180);
  if (!title) return null;

  let end = toIso(raw.end);
  if (end && end < start) end = null;

  const venue = cleanLine(raw.venue || '', 120) || null;
  const description = clean(raw.description || '', { maxLength: 600 });
  const virtual = Boolean(raw.virtual) || VIRTUAL.test(`${venue || ''} ${title}`);

  return {
    id: `${raw.source}:${raw.sourceId}`,
    source: raw.source,
    campus: CAMPUS_BY_SOURCE[raw.source] ?? 'Other',
    title,
    description,
    start,
    end,
    allDay: Boolean(raw.allDay),
    venue,
    org: cleanLine(raw.org || '', 120) || null,
    url: raw.url || null,
    virtual,
  };
}

/** Exact-ish key: same normalised title and the same start minute. */
export function dedupeKey(event) {
  return `${[...titleTokens(event.title)].join(' ')}|${event.start.slice(0, 16)}`;
}

const STOP = new Set(['the', 'a', 'an', 'at', 'of', 'for', 'and', 'with', 'to', 'in', 'on', 'unc', 'chapel', 'hill', 'carolina', 'center', 'fall', 'spring', 'night', 'one', 'two']);

export function titleTokens(title = '') {
  const words = title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bcs\b/g, ' computer science ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w) && !/^(19|20)\d\d$/.test(w));
  return new Set(words);
}

/** "Carolina Data Challenge 2026" -> "cdc", so the club's "CDC 2026" post can be matched. */
function acronym(title = '') {
  return title
    .replace(/\b(19|20)\d\d\b/g, '')
    .split(/[\s:|/-]+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^(of|and|the|for|at|a|an)$/i.test(w))
    .map((w) => w[0].toLowerCase())
    .join('');
}

function easternDay(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

/**
 * Two listings are the same event when they fall on the same day, start close together (or one is
 * an all-day listing), and their titles share most of their words. Different feeds retitle the
 * same fair three ways: "Fall Jobs & Internships Career Fair 2026", "UNC Career Center Fall Jobs
 * and Internships Career Fair", "UNC Career Center Fall Jobs & Internships Career Fair 2026".
 */
export function sameEvent(a, b) {
  if (easternDay(a.start) !== easternDay(b.start)) return false;
  const close = a.allDay || b.allDay || Math.abs(Date.parse(a.start) - Date.parse(b.start)) <= 90 * 60_000;
  if (!close) return false;

  const ta = titleTokens(a.title);
  const tb = titleTokens(b.title);
  if (ta.size && tb.size) {
    let common = 0;
    for (const t of ta) if (tb.has(t)) common++;
    const smaller = Math.min(ta.size, tb.size);
    if (common === ta.size && common === tb.size) return true;
    if (smaller >= 2 && common / smaller >= 0.6) return true;
  }
  const single = (set) => (set.size === 1 ? [...set][0] : null);
  const sa = single(ta);
  const sb = single(tb);
  return Boolean((sa && sa.length >= 3 && sa === acronym(b.title)) || (sb && sb.length >= 3 && sb === acronym(a.title)));
}

// When the same event arrives twice, keep the copy from whoever runs it. The CS department and
// the Career Hub post their own events; Heel Life and the main calendar mostly re-list them.
const SOURCE_PRIORITY = { unccs: 6, careerhub: 5, heellife: 4, watch: 4, duke: 3, ncsu: 3, localist: 2 };

export function dedupe(events) {
  const byDay = new Map();
  for (const ev of events) {
    const day = easternDay(ev.start);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(ev);
  }

  const out = [];
  for (const group of byDay.values()) {
    const kept = [];
    for (const ev of group) {
      const idx = kept.findIndex((k) => sameEvent(k, ev));
      if (idx === -1) {
        kept.push(ev);
        continue;
      }
      const existing = kept[idx];
      const keepNew = (SOURCE_PRIORITY[ev.source] ?? 0) > (SOURCE_PRIORITY[existing.source] ?? 0);
      const winner = { ...(keepNew ? ev : existing) };
      const loser = keepNew ? existing : ev;
      if (loser.description.length > winner.description.length * 2) winner.description = loser.description;
      winner.virtual = winner.virtual || loser.virtual;
      winner.alsoListed = [...new Set([...(winner.alsoListed || []), loser.source, ...(loser.alsoListed || [])])];
      kept[idx] = winner;
    }
    out.push(...kept);
  }
  return out;
}
