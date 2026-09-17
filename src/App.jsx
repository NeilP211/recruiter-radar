import { useEffect, useMemo, useState } from 'react';
import NextUp from './components/NextUp.jsx';
import Stats from './components/Stats.jsx';
import HighList from './components/HighList.jsx';
import LookList from './components/LookList.jsx';
import Filters from './components/Filters.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import SourceHealth from './components/SourceHealth.jsx';
import { updatedAgo } from './lib/format.js';

const DATA_URL = `${import.meta.env.BASE_URL}data/events.json`;
const WEEK = 7 * 86_400_000;

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
    const now = Date.now();
    // Keep an event on the page until two hours after it started, or until it ends.
    const upcoming = data.events.filter((e) => Date.parse(e.end || e.start) >= now - 2 * 3600_000);
    const shown = upcoming.filter((e) => matches(e, filters));
    const high = shown.filter((e) => e.tier === 'high');
    return {
      high,
      medium: shown.filter((e) => e.tier === 'medium'),
      archive: (data.archive || []).filter((e) => matches(e, filters)),
      next: high.find((e) => Date.parse(e.start) >= now - 3600_000) || high[0] || null,
      thisWeek: shown.filter((e) => Date.parse(e.start) - now < WEEK).length,
      companies: new Set(shown.flatMap((e) => e.companies || [])).size,
    };
  }, [data, filters]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="dot" aria-hidden="true" />
          <h1>Recruiter Radar</h1>
        </div>
        <p className="scope-note">CS / ML / SWE recruiting &middot; UNC, Duke, NC State</p>
        <div className="spacer" />
        {data && <div className="updated">Updated {updatedAgo(data.generatedAt)}</div>}
        <button type="button" id="alerts-toggle" className={alertsOpen ? 'ghost-btn on' : 'ghost-btn'} aria-expanded={alertsOpen} onClick={() => setAlertsOpen((v) => !v)}>
          Alerts
        </button>
      </header>

      {alertsOpen && <AlertsPanel onClose={() => setAlertsOpen(false)} />}
      {error && <div className="card notice">Could not load events ({error}). The next refresh runs within three hours.</div>}
      {!data && !error && <div className="card notice">Loading events...</div>}

      {view && (
        <>
          <Filters filters={filters} onChange={setFilters} />

          <div className="grid">
            <NextUp event={view.next} />
            <Stats
              items={[
                ['High value', view.high.length],
                ['Worth a look', view.medium.length],
                ['Next 7 days', view.thisWeek],
                ['Employers', view.companies],
              ]}
            />
            <HighList events={view.high} />
            <LookList events={view.medium} />
            <LookList events={view.archive} past />
            <SourceHealth data={data} />
          </div>
        </>
      )}
    </div>
  );
}
