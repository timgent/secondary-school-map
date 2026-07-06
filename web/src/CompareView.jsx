import { METRICS, METRIC_BY_KEY, resolveKey, yearLabel } from "./metrics.js";
import { haversineMiles } from "./distance.js";

// Side-by-side comparison of the selected schools (2–5). Metric rows highlight
// the best value across the compared schools; the year selector drives the
// Progress 8 / Attainment 8 columns just as it does elsewhere.

const metricRow = (m) => ({
  key: m.key,
  label: m.label,
  yearTag: m.multiYear,
  get: (p, year) => p[resolveKey(m, year)],
  format: (v) => (v == null ? "—" : m.format(v)),
  best: m.lowerBetter ? "min" : "max",
});

const textRow = (key, label, get) => ({ key, label, get, format: (v) => v ?? "—" });

const ROWS = [
  textRow("funding", "Funding", (p) => p.funding),
  textRow("type", "Type", (p) => p.type),
  textRow("local_authority", "Local authority", (p) => p.local_authority),
  textRow("postcode", "Postcode", (p) => p.postcode),
  textRow("stage", "Stage", (p) => p.stage),
  textRow("ages", "Age range", (p) =>
    p.age_low != null && p.age_high != null ? `${p.age_low}–${p.age_high}` : null),
  textRow("selective", "Selective", (p) => (p.selective ? "Yes" : "No")),
  textRow("faith", "Faith", (p) => (p.has_faith ? p.religious_character || "Yes" : "No")),
  textRow("ofsted", "Ofsted", ofstedSummary),
  metricRow(METRIC_BY_KEY.progress8),
  metricRow(METRIC_BY_KEY.attainment8),
  metricRow(METRIC_BY_KEY.pct_grade5_eng_maths),
  metricRow(METRIC_BY_KEY.ebacc_aps),
  metricRow(METRIC_BY_KEY.absence_overall),
  metricRow(METRIC_BY_KEY.persistent_absence),
];

function ofstedSummary(p) {
  if (p.ofsted_framework === "report_card_2025") {
    const parts = [
      ["Ach", p.ofsted_achievement],
      ["Beh", p.ofsted_behaviour],
      ["Lead", p.ofsted_leadership],
    ].filter(([, v]) => v);
    return parts.length ? parts.map(([k, v]) => `${k}: ${v}`).join(", ") : "2025 report card";
  }
  return p.ofsted_overall_legacy || p.ofsted_ungraded_outcome || "—";
}

// index of the best value(s) in a metric row, for highlighting
function bestIndices(values, dir) {
  const nums = values.map((v) => (v == null || Number.isNaN(v) ? null : v));
  const present = nums.filter((v) => v != null);
  if (present.length < 2) return new Set(); // nothing to compare against
  const target = dir === "min" ? Math.min(...present) : Math.max(...present);
  const set = new Set();
  nums.forEach((v, i) => { if (v === target) set.add(i); });
  return set;
}

export default function CompareView({ schools, year, centre, onToggleCompare, onClose }) {
  if (!schools.length)
    return (
      <div className="comparewrap">
        <div className="comparehead">
          <h2>Compare</h2>
          <button className="cmpclosebtn" onClick={onClose}>Close ×</button>
        </div>
        <p className="listempty">No schools selected. Add some from the map or list.</p>
      </div>
    );

  // optional distance row when a list centre postcode is set
  const distRow = centre
    ? {
        key: "distance",
        label: `Distance from ${centre.label}`,
        get: (p) =>
          p.__lng != null ? haversineMiles(centre.lng, centre.lat, p.__lng, p.__lat) : null,
        format: (v) => (v == null ? "—" : `${v.toFixed(1)} mi`),
        best: "min",
      }
    : null;
  const rows = distRow ? [distRow, ...ROWS] : ROWS;

  return (
    <div className="comparewrap">
      <div className="comparehead">
        <h2>Compare <span className="muted">· {schools.length} schools</span></h2>
        <button className="cmpclosebtn" onClick={onClose}>Close ×</button>
      </div>
      <div className="comparescroll">
        <table className="comparetable">
          <thead>
            <tr>
              <th className="rowlabel"></th>
              {schools.map((p) => (
                <th key={p.urn}>
                  <div className="cmphname">{p.name}</div>
                  {onToggleCompare && (
                    <button className="cmpremove" onClick={() => onToggleCompare(p.urn)}>
                      Remove
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const values = schools.map((p) => row.get(p, year));
              const best = row.best ? bestIndices(values, row.best) : new Set();
              return (
                <tr key={row.key}>
                  <th className="rowlabel">
                    {row.label}
                    {row.yearTag && <span className="colyear"> {yearLabel(year)}</span>}
                  </th>
                  {values.map((v, i) => (
                    <td key={i} className={best.has(i) ? "best" : ""}>
                      {row.format(v)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
