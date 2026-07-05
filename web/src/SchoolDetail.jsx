import { YEARS, METRIC_BY_KEY } from "./metrics.js";

// Detail card for a clicked school. Also the natural home (later) for the
// commute / house-price / jobs enrichment (Milestones 3–4).
export default function SchoolDetail({ school: p, year, onClose }) {
  const p8 = METRIC_BY_KEY.progress8;
  const a8 = METRIC_BY_KEY.attainment8;
  const ages =
    p.age_low != null && p.age_high != null ? `ages ${p.age_low}–${p.age_high}` : null;

  return (
    <div className="detail">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h3>{p.name}</h3>
      <p className="sub">
        <span className={`tag ${p.funding === "Independent" ? "indep" : "state"}`}>
          {p.funding}
        </span>{" "}
        {p.type} · {p.local_authority} · {p.postcode}
        {p.selective ? " · Selective" : ""}
        {p.has_faith ? ` · ${p.religious_character}` : ""}
      </p>
      <p className="stage">
        {p.stage}
        {ages ? ` · ${ages}` : ""}
      </p>

      {/* Multi-year Progress 8 & Attainment 8 with national percentiles */}
      <table className="years">
        <thead>
          <tr>
            <th></th>
            {YEARS.map((y) => (
              <th key={y.tag} className={y.tag === year ? "sel" : ""}>{y.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[p8, a8].map((m) => (
            <tr key={m.key}>
              <th>{m.label}</th>
              {YEARS.map((y) => {
                const v = p[`${m.key}_${y.tag}`];
                const pct = p[`${m.key}_${y.tag}_pct`];
                return (
                  <td key={y.tag} className={y.tag === year ? "sel" : ""}>
                    {v == null ? "—" : m.format(v)}
                    {pct != null && <div className="pct">{ordinal(pct)} pctile</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {p[`progress8_${year}`] != null && (
        <p className="ci">
          {YEARS.find((y) => y.tag === year)?.label} Progress 8 95% interval:{" "}
          {fmt(p[`progress8_ci_low_${year}`])} to {fmt(p[`progress8_ci_high_${year}`])}
        </p>
      )}

      {/* Single-year GCSE metrics + Ofsted */}
      <table>
        <tbody>
          <MetricRow p={p} m={METRIC_BY_KEY.pct_grade5_eng_maths} />
          <MetricRow p={p} m={METRIC_BY_KEY.ebacc_aps} />
          <tr>
            <th>Ofsted</th>
            <td>{ofstedText(p)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MetricRow({ p, m }) {
  const v = p[m.key];
  const pct = p[m.pctKey];
  return (
    <tr>
      <th>{m.label}</th>
      <td>
        {v == null ? "—" : m.format(v)}
        {pct != null && <span className="pct"> ({ordinal(pct)} pctile)</span>}
      </td>
    </tr>
  );
}

const fmt = (v) => (v == null ? "?" : v.toFixed(2));
const ordinal = (pct) => `${Math.round(pct)}th`;

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
