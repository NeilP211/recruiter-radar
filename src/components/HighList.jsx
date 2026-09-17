import { monthShort, dayNum, weekdayShort, timeLabel, relativeDay } from '../lib/format.js';
import { downloadIcs } from '../lib/download.js';
import { Tags, where, via } from './shared.jsx';

export default function HighList({ events }) {
  return (
    <section className="card col-8" aria-labelledby="high-h">
      <h2 id="high-h">High value <span className="h-count">{String(events.length).padStart(2, '0')}</span></h2>
      <p className="card-note">Employers recruiting, resume submissions, career fairs. New ones trigger a phone alert.</p>
      {events.length ? (
        <ol className="events">
          {events.map((e) => {
            const rel = relativeDay(e.start);
            return (
              <li key={e.id} className="event">
                <div className="datecol">
                  <span className="d-mon">{monthShort(e.start)}</span>
                  <span className="d-day">{dayNum(e.start)}</span>
                  <span className="d-wd">{weekdayShort(e.start)}</span>
                </div>
                <div className="event-main">
                  <p className={rel === 'Today' || rel === 'Tomorrow' ? 'when soon' : 'when'}>{rel} / {timeLabel(e)}</p>
                  <p className="name">{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer">{e.title}</a> : e.title}</p>
                  <p className="sub">{[e.org, where(e)].filter(Boolean).join(' · ')}</p>
                  <Tags event={e} />
                </div>
                <div className="event-actions">
                  {e.url && <a className="ghost-btn" href={e.url} target="_blank" rel="noopener noreferrer">Details</a>}
                  <button type="button" className="ghost-btn" onClick={() => downloadIcs(e)} aria-label={`Add ${e.title} to calendar`}>+ Cal</button>
                  <span className="via">{via(e)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="empty">Nothing high value matches these filters.</p>
      )}
    </section>
  );
}
