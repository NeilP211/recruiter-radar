const CAMPUSES = [['all', 'All'], ['UNC', 'UNC'], ['Duke', 'Duke'], ['NC State', 'NC State'], ['Virtual', 'Virtual']];
const KINDS = [['all', 'All types'], ['recruiting', 'Recruiting'], ['fair', 'Career fairs'], ['hackathon', 'Hackathons'], ['talk', 'Talks']];

function Toggle({ label, name, options, value, onPick }) {
  return (
    <div className="toggle-group">
      <span className="toggle-label" id={`${name}-label`}>{label}</span>
      <div className="toggle" role="radiogroup" aria-labelledby={`${name}-label`}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            id={`${name}-${key.replace(/\s/g, '-')}`}
            role="radio"
            aria-checked={value === key}
            className={value === key ? 'active' : ''}
            onClick={() => onPick(key)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <div className="card filterbar">
      <Toggle label="Where" name="campus" options={CAMPUSES} value={filters.campus} onPick={(campus) => set({ campus })} />
      <Toggle label="Type" name="kind" options={KINDS} value={filters.kind} onPick={(kind) => set({ kind })} />
      <label className="search" htmlFor="search">
        <span className="toggle-label">Search</span>
        <input id="search" type="search" placeholder="tesla, ml, resume..." value={filters.query} onChange={(e) => set({ query: e.target.value })} />
      </label>
    </div>
  );
}
