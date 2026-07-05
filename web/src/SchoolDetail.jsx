import { METRICS } from "./metrics.js";

// Detail card for a clicked school. Also the natural home (later) for the
// commute / house-price / jobs enrichment (Milestones 3–4).
export default function SchoolDetail({ school: p, onClose }) {
  return (
    <div className="detail">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h3>{p.name}</h3>
      <p className="sub">
        {p.type} · {p.local_authority} · {p.postcode}
        {p.selective ? " · Grammar" : ""}
        {p.has_faith ? ` · ${p.religious_character}` : ""}
      </p>

      <table>
        <tbody>
          {METRICS.map((m) => {
            const v = p[m.key];
            const pct = p[m.pctKey];
            return (
              <tr key={m.key}>
                <th>{m.label}</th>
                <td>
                  {v == null ? "—" : m.format(v)}
                  {pct != null && <span className="pct"> ({ordinal(pct)} pctile)</span>}
                </td>
              </tr>
            );
          })}
          {p.progress8 != null && (
            <tr>
              <th>P8 95% interval</th>
              <td>
                {p.progress8_ci_low?.toFixed(2)} to {p.progress8_ci_high?.toFixed(2)}
              </td>
            </tr>
          )}
          <tr>
            <th>Ofsted</th>
            <td>{ofstedText(p)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ordinal(pct) {
  return `${Math.round(pct)}th`;
}

function ofstedText(p) {
  if (p.ofsted_framework === "report_card_2025") {
    const parts = [
      ["Achievement", p.ofsted_achievement],
      ["Behaviour", p.ofsted_behaviour],
      ["Leadership", p.ofsted_leadership],
    ].filter(([, v]) => v);
    return (
      <>
        <span className="tag">2025 report card</span>
        <br />
        {parts.map(([k, v]) => `${k}: ${v}`).join(" · ") || "graded"}
      </>
    );
  }
  if (p.ofsted_overall_legacy) return p.ofsted_overall_legacy;
  if (p.ofsted_ungraded_outcome) return p.ofsted_ungraded_outcome;
  return "Not inspected / no data";
}
