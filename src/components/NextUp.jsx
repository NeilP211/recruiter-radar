import { fullDate, timeLabel, relativeDay } from '../lib/format.js';
import { downloadIcs } from '../lib/download.js';
import { Tags, where } from './shared.jsx';

export default function NextUp({ event }) {
  return (
    <section className="card col-12 hero" aria-labelledby="next-h">
      <h2 id="next-h">Next high-value event</h2>
      {event ? (
        <div className="hero-body">
          <div className="hero-when">
            <span className="hero-rel">{relativeDay(event.start)}</span>
            <span className="hero-date">{fullDate(event.start)}</span>
            <span className="hero-time">{timeLabel(event)}</span>
          </div>
          <div className="hero-main">
            <p className="hero-title">
              {event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a> : event.title}
            </p>
            <p className="sub">{[event.org, where(event)].filter(Boolean).join(' · ')}</p>
            <Tags event={event} />
          </div>
          <div className="hero-actions">
            {event.url && <a className="solid-btn" href={event.url} target="_blank" rel="noopener noreferrer">Sign up</a>}
            <button type="button" className="ghost-btn" onClick={() => downloadIcs(event)}>Add to calendar</button>
          </div>
        </div>
      ) : (
        <p className="empty">Nothing high value matches these filters right now.</p>
      )}
    </section>
  );
}
