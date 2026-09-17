import { updatedAgo } from '../lib/format.js';

export default function SourceHealth({ data }) {
  const total = data.sources.reduce((n, s) => n + (s.count || 0), 0);
  return (
    <section className="card col-12" aria-labelledby="src-h">
      <h2 id="src-h">Sources <span className="h-count">{total.toLocaleString()} listings scanned</span></h2>
      <ul className="sources">
        {data.sources.map((s) => (
          <li key={s.key} className={s.ok ? 'src' : 'src down'}>
            <span className="sq" aria-hidden="true" />
            <a href={s.home} target="_blank" rel="noopener noreferrer">{s.label}</a>
            <span className="src-n">{s.ok ? s.count.toLocaleString() : s.stale ? `stale ${s.staleAgeHours}h` : 'down'}</span>
          </li>
        ))}
      </ul>
      <p className="fine">
        Scored by keyword rules, not a person, so read the details before you go. Last run {updatedAgo(data.generatedAt)}.{' '}
        <a href="https://github.com/NeilP211/recruiter-radar" target="_blank" rel="noopener noreferrer">Source</a>
      </p>
    </section>
  );
}
