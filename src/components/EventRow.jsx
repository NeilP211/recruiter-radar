import { monthShort, dayNum, timeLabel, relativeDay } from '../lib/format.js';
import { downloadIcs } from '../lib/download.js';
import { Reasons, where } from './EventCard.jsx';

export default function EventRow({ event, past = false }) {
  return (
    <div className={past ? 'row row-past' : 'row'}>
      <div className="row-date">
        <span className="mon">{monthShort(event.start)}</span> <span className="day">{dayNum(event.start)}</span>
      </div>
      <div className="row-body">
        <h3>{event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a> : event.title}</h3>
        <p className="meta">
          <span>{past ? relativeDay(event.start) : `${relativeDay(event.start)}, ${timeLabel(event)}`}</span>
          {event.org && <span>{event.org}</span>}
          <span>{where(event)}</span>
        </p>
        <Reasons event={event} />
      </div>
      {!past && (
        <button type="button" className="btn btn-small" onClick={() => downloadIcs(event)} aria-label={`Add ${event.title} to calendar`}>
          + Cal
        </button>
      )}
    </div>
  );
}
