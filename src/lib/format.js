// Every time on the site is shown in Eastern time, whatever timezone the viewer's phone is in.
const TZ = 'America/New_York';

const part = (iso, opts) => new Date(iso).toLocaleString('en-US', { timeZone: TZ, ...opts });

export const monthShort = (iso) => part(iso, { month: 'short' }).toUpperCase();
export const dayNum = (iso) => part(iso, { day: 'numeric' });
export const weekdayShort = (iso) => part(iso, { weekday: 'short' });
export const timeLabel = (e) => (e.allDay ? 'All day' : part(e.start, { hour: 'numeric', minute: '2-digit' }));
export const fullDate = (iso) => part(iso, { weekday: 'long', month: 'long', day: 'numeric' });

export function easternDayKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}

/** "Today", "Tomorrow", "In 5 days", "In 3 weeks". */
export function relativeDay(iso, now = new Date()) {
  const a = Date.parse(`${easternDayKey(now.toISOString())}T00:00:00Z`);
  const b = Date.parse(`${easternDayKey(iso)}T00:00:00Z`);
  const days = Math.round((b - a) / 86_400_000);
  if (days < 0) return days === -1 ? 'Yesterday' : `${-days} days ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 14) return `In ${days} days`;
  return `In ${Math.round(days / 7)} weeks`;
}

export function updatedAgo(iso, now = new Date()) {
  const mins = Math.round((now - new Date(iso)) / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours}h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export const SOURCE_LABELS = {
  unccs: 'UNC Computer Science', careerhub: 'UNC Career Hub', heellife: 'Heel Life',
  localist: 'UNC Calendar', duke: 'Duke Calendar', ncsu: 'NC State Calendar', watch: 'Company page',
};
