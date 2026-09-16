import { useEffect, useMemo, useState } from 'react';
import EventCard from './components/EventCard.jsx';
import EventRow from './components/EventRow.jsx';
import Filters from './components/Filters.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import SourceHealth from './components/SourceHealth.jsx';
import { updatedAgo } from './lib/format.js';

const DATA_URL = `${import.meta.env.BASE_URL}data/events.json`;

const CAMPUS_TEST = {
  all: () => true,
  UNC: (e) => e.campus === 'UNC',
  Duke: (e) => e.campus === 'Duke',
  'NC State': (e) => e.campus === 'NC State',
  Virtual: (e) => e.virtual,
};

function matches(e, { campus, kind, query }) {
  if (!CAMPUS_TEST[campus](e)) return false;
  if (kind !== 'all' && e.kind !== kind) return false;
  if (!query) return true;
  const hay = `${e.title} ${e.org || ''} ${e.venue || ''} ${(e.companies || []).join(' ')} ${(e.reasons || []).join(' ')}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ campus: 'all', kind: 'all', query: '' });
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    fetch(DATA_URL, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const now = Date.now() - 2 * 3600_000; // keep events that started in the last two hours
    const upcoming = data.events.filter((e) => Date.parse(e.end || e.start) >= now);
    const shown = upcoming.filter((e) => matches(e, filters));
    return {
      high: shown.filter((e) => e.tier === 'high'),
      medium: shown.filter((e) => e.tier === 'medium'),
      archive: (data.archive || []).filter((e) => matches(e, filters)),
      totalHigh: upcoming.filter((e) => e.tier === 'high').length,
      totalMedium: upcoming.filter((e) => e.tier === 'medium').length,
    };
  }, [data, filters]);

  const okSources = data ? data.sources.filter((s) => s.ok).length : 0;

  return (
    <div className="page">
      <header className="masthead">
        <div className="brand">
          <span className="scope" aria-hidden="true"><i /></span>
          <div>
            <h1>Recruiter Radar</h1>
            <p className="tagline">
              Recruiter visits, resume drops and tech career fairs at UNC, Duke and NC State.
              {data && (
                <span className="freshness">
                  {' '}Scanned {data.counts.scanned.toLocaleString()} listings from {okSources} of {data.sources.length} calendars, updated {updatedAgo(data.generatedAt)}.
                </span>
              )}
            </p>
          </div>
        </div>
        <button type="button" id="alerts-toggle" className="alerts-button" aria-expanded={alertsOpen} onClick={() => setAlertsOpen((v) => !v)}>
          <span className="bell" aria-hidden="true" />
          Alerts and calendar
        </button>
      </header>

      {alertsOpen && <AlertsPanel onClose={() => setAlertsOpen(false)} />}

      {error && <p className="notice">Could not load events ({error}). The next refresh runs within three hours.</p>}
      {!data && !error && <p className="notice">Loading events...</p>}

      {view && (
        <>
          <Filters filters={filters} onChange={setFilters} />

          <section className="tier tier-high" aria-labelledby="high-heading">
            <div className="tier-head">
              <h2 id="high-heading">High value</h2>
              <p>Employers recruiting, resume submissions and career fairs. New ones trigger a phone alert.</p>
              <span className="count">{view.high.length}{view.high.length !== view.totalHigh ? ` of ${view.totalHigh}` : ''}</span>
            </div>
            {view.high.length ? (
              <ol className="cards">
                {view.high.map((e) => <li key={e.id}><EventCard event={e} /></li>)}
              </ol>
            ) : (
              <p className="empty">Nothing high value matches these filters right now.</p>
            )}
          </section>

          <section className="tier tier-medium" aria-labelledby="medium-heading">
            <div className="tier-head">
              <h2 id="medium-heading">Worth a look</h2>
              <p>Hackathons, CS career panels, mock interviews and company tech talks.</p>
              <span className="count">{view.medium.length}{view.medium.length !== view.totalMedium ? ` of ${view.totalMedium}` : ''}</span>
            </div>
            {view.medium.length ? (
              <ol className="rows">
                {view.medium.map((e) => <li key={e.id}><EventRow event={e} /></li>)}
              </ol>
            ) : (
              <p className="empty">Nothing else matches these filters.</p>
            )}
          </section>

          <details className="tier tier-archive">
            <summary>
              <h2>Missed</h2>
              <span>High value events that already happened, so you can see what comes around each semester.</span>
              <span className="count">{view.archive.length}</span>
            </summary>
            {view.archive.length ? (
              <ol className="rows">
                {view.archive.map((e) => <li key={e.id}><EventRow event={e} past /></li>)}
              </ol>
            ) : (
              <p className="empty">The archive fills in as events pass. Nothing has been recorded yet.</p>
            )}
          </details>

          <SourceHealth data={data} />
        </>
      )}
    </div>
  );
}
