const CAMPUSES = [['all', 'Everywhere'], ['UNC', 'UNC'], ['Duke', 'Duke'], ['NC State', 'NC State'], ['Virtual', 'Virtual']];
const KINDS = [['all', 'All types'], ['recruiting', 'Recruiting'], ['fair', 'Career fairs'], ['hackathon', 'Hackathons'], ['talk', 'Talks and panels']];

function Group({ label, name, options, value, onPick }) {
  return (
    <fieldset className="chips">
      <legend>{label}</legend>
      {options.map(([key, text]) => (
        <label key={key} className={value === key ? 'pick picked' : 'pick'}>
          <input type="radio" id={`${name}-${key.replace(/\s/g, '-')}`} name={name} value={key} checked={value === key} onChange={() => onPick(key)} />
          {text}
        </label>
      ))}
    </fieldset>
  );
}

export default function Filters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <div className="filters">
      <Group label="Where" name="campus" options={CAMPUSES} value={filters.campus} onPick={(campus) => set({ campus })} />
      <Group label="Type" name="kind" options={KINDS} value={filters.kind} onPick={(kind) => set({ kind })} />
      <label className="search" htmlFor="search">
        <span className="visually-hidden">Search events</span>
        <input id="search" type="search" placeholder="Search: Tesla, ML, resume..." value={filters.query} onChange={(e) => set({ query: e.target.value })} />
      </label>
    </div>
  );
}
