// Eastern wall-clock time to an ISO instant, copied from HeelSeek.
// Probing both offsets handles EST and EDT without a timezone library.

/**
 * Convert an America/New_York wall-clock time to an ISO instant.
 * Probes both candidate offsets and keeps the one that round-trips, which
 * handles EST/EDT without pulling in a timezone library.
 */
export function easternToIso(year, month, day, hour, minute, second = 0) {
  for (const offset of [4, 5]) {
    const guess = new Date(Date.UTC(year, month - 1, day, hour + offset, minute, second));
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(guess);
    const get = (t) => Number(parts.find((p) => p.type === t)?.value);
    if (
      get('year') === year && get('month') === month && get('day') === day &&
      get('hour') % 24 === hour % 24 && get('minute') === minute
    ) {
      return guess.toISOString();
    }
  }
  // Spring-forward gap: no valid wall clock, fall back to EDT.
  return new Date(Date.UTC(year, month - 1, day, hour + 4, minute, second)).toISOString();
}
