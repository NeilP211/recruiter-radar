import { buildCalendar } from './ics.js';

/** Save one event as an .ics file the phone or laptop calendar can open. */
export function downloadIcs(event) {
  const blob = new Blob([buildCalendar([event], { name: event.title })], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
