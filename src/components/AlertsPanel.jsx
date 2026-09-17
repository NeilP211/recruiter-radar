const CAL_URL = new URL(`${import.meta.env.BASE_URL}data/high.ics`, window.location.origin).href;
const WEBCAL = CAL_URL.replace(/^https?:/, 'webcal:');

export default function AlertsPanel({ onClose }) {
  return (
    <section className="card alerts" aria-labelledby="alerts-h">
      <div className="alerts-head">
        <h2 id="alerts-h">Alerts and calendar</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close alerts panel">&times;</button>
      </div>
      <div className="alerts-grid">
        <div>
          <p className="kicker">Phone push</p>
          <p className="body">New high-value events push to your phone through <a href="https://ntfy.sh" target="_blank" rel="noopener noreferrer">ntfy</a>, checked every three hours.</p>
          <ol className="steps">
            <li><span>01</span> Install ntfy from the App Store or Google Play.</li>
            <li><span>02</span> Tap + and subscribe to your private topic (kept as a GitHub secret, never shown here).</li>
            <li><span>03</span> Leave notifications on.</li>
          </ol>
        </div>
        <div>
          <p className="kicker">Calendar feed</p>
          <p className="body">Subscribe once and every high-value event lands in your calendar and stays up to date.</p>
          <div className="row-btns">
            <a className="solid-btn" href={WEBCAL}>Apple / Outlook</a>
            <a className="ghost-btn" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(WEBCAL)}`} target="_blank" rel="noopener noreferrer">Google Calendar</a>
          </div>
          <p className="fine"><code>{CAL_URL}</code></p>
        </div>
      </div>
    </section>
  );
}
