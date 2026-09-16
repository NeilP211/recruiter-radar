const CAL_URL = new URL(`${import.meta.env.BASE_URL}data/high.ics`, window.location.origin).href;
const WEBCAL = CAL_URL.replace(/^https?:/, 'webcal:');

export default function AlertsPanel({ onClose }) {
  return (
    <aside className="panel" aria-label="Alerts and calendar">
      <div className="panel-grid">
        <section>
          <h2>Phone alerts</h2>
          <p>When a new high value event appears, a push goes out through <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer">ntfy</a>, a free notification app with no account.</p>
          <ol className="steps">
            <li>Install ntfy from the App Store or Google Play.</li>
            <li>Tap <b>+</b> and subscribe to your private topic name. It is stored as a GitHub secret on this repo and never shown on this page.</li>
            <li>Leave notifications on. Checks run every three hours.</li>
          </ol>
        </section>
        <section>
          <h2>Calendar feed</h2>
          <p>Subscribe once and every high value event shows up in your calendar, updating on its own.</p>
          <div className="actions">
            <a className="btn btn-primary" href={WEBCAL}>Subscribe (Apple, Outlook)</a>
            <a className="btn" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(WEBCAL)}`} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          </div>
          <p className="fine">Feed URL: <code>{CAL_URL}</code></p>
        </section>
      </div>
      <button type="button" className="btn btn-small panel-close" onClick={onClose}>Close</button>
    </aside>
  );
}
