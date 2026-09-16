import { updatedAgo } from '../lib/format.js';

export default function SourceHealth({ data }) {
  return (
    <footer className="sources">
      <h2>Where this comes from</h2>
      <ul>
        {data.sources.map((s) => (
          <li key={s.key} className={s.ok ? 'src ok' : 'src bad'}>
            <span className="led" aria-hidden="true" />
            <a href={s.home} target="_blank" rel="noopener noreferrer">{s.label}</a>
            <span className="src-note">
              {s.ok ? `${s.count.toLocaleString()} listings` : s.stale ? `down, showing copy from ${s.staleAgeHours}h ago` : `down: ${s.error}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="fine">
        Scored by keyword rules, not a person, so read the details before you go. Last run {updatedAgo(data.generatedAt)}.
        {' '}<a href="https://github.com/NeilP211/recruiter-radar" target="_blank" rel="noopener noreferrer">Source on GitHub</a>
      </p>
    </footer>
  );
}
