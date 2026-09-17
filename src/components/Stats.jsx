export default function Stats({ items }) {
  return (
    <section className="col-12 stats" aria-label="Summary">
      {items.map(([label, value]) => (
        <div key={label} className="card stat">
          <span className="stat-num">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </section>
  );
}
