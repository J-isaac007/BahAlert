export default function HotlineCard({ hotline }) {
  const { name, number, area, verified } = hotline;
  return (
    <article className="card hotline">
      <div>
        <strong>{name}</strong>
        {area && <div className="muted">{area}</div>}
      </div>
      {number && verified !== false ? (
        <a className="btn btn-primary" href={`tel:${number.replace(/[^\d+]/g, '')}`}>
          Call {number}
        </a>
      ) : (
        <span className="muted">Number not yet verified</span>
      )}
    </article>
  );
}
