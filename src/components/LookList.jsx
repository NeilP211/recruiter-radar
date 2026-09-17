import { monthShort, dayNum, timeLabel, relativeDay } from '../lib/format.js';
import { downloadIcs } from '../lib/download.js';
import { Tags, where } from './shared.jsx';

export default function LookList({ events, past = false }) {
  const id = past ? 'missed-h' : 'look-h';
  return (
    <section className={past ? 'card col-12 missed' : 'card col-4 look'} aria-labelledby={id}>
      <h2 id={id}>{past ? 'Missed' : 'Worth a look'} <span className="h-count">{String(events.length).padStart(2, '0')}</span></h2>
      <p className="card-note">
        {past
          ? 'High-value events that already happened. Fills in as the semester goes, so you can see what comes around.'
          : 'Hackathons, CS panels, mock interviews, company tech talks.'}
      </p>
      {events.length ? (
        <ol className={past ? 'ranklist ranklist-wide' : 'ranklist'}>
          {events.map((e) => (
            <li key={e.id} className="rankrow">
              <div className="rank">
                <span>{monthShort(e.start)}</span>
                <b>{dayNum(e.start)}</b>
              </div>
              <div className="meta">
                <p className="name">{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer">{e.title}</a> : e.title}</p>
                <p className="sub">{past ? relativeDay(e.start) : `${relativeDay(e.start)}, ${timeLabel(e)}`} &middot; {where(e)}</p>
                <Tags event={e} />
              </div>
              {!past && (
                <button type="button" className="icon-btn" onClick={() => downloadIcs(e)} aria-label={`Add ${e.title} to calendar`} title="Add to calendar">+</button>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">{past ? 'Nothing recorded yet.' : 'Nothing else matches these filters.'}</p>
      )}
    </section>
  );
}
