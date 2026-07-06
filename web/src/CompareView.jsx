import { METRIC_BY_KEY, resolveKey, resolvePctKey, YEARS, yearLabel } from "./metrics.js";
import { haversineMiles } from "./distance.js";

// Side-by-side comparison of the selected schools (2–5). Metric rows highlight
// the best value across the compared schools; the year selector drives the
// band / single-year columns just as it does elsewhere. The Progress 8 &
// Attainment 8 sections expand to the full 3-year breakdown + 3-year average
// (with per-year national percentiles), mirroring the school detail card.

// Progress 8 prior-attainment bands (pupils grouped by end-of-primary KS2 level).
const BANDS = [
  { key: "progress8_low", label: "Lower starters" },
  { key: "progress8_mid", label: "Middle starters" },
  { key: "progress8_high", label: "Higher starters" },
];

// A single-year metric row (uses the year selector for multi-year metrics).
const metricRow = (m) => ({
  key: m.key,
  label: m.label,
  yearTag: m.multiYear,
  get: (p, year) => p[resolveKey(m, year)],
  getPct: (p, year) => p[resolvePctKey(m, year)],
  format: (v) => (v == null ? "—" : m.format(v)),
  best: m.lowerBetter ? "min" : "max",
});

// Per-year + 3-yr-average breakdown rows for a multi-year metric, each carrying
// its own national percentile. These ignore the year selector — the point is to
// see every year at once.
const breakdownRows = (m) =>
  YEARS.map((y) => ({
    key: `${m.key}_${y.tag}`,
    label: y.avg ? "3-year average" : y.label,
    indent: true,
    get: (p) => p[`${m.key}_${y.tag}`],
    getPct: (p) => p[`${m.key}_${y.tag}_pct`],
    format: (v) => (v == null ? "—" : m.format(v)),
    best: m.lowerBetter ? "min" : "max",
  }));

// Progress 8 95% confidence interval for the selected year (no "best" — it's a
// range, not a single comparable value).
const p8IntervalRow = {
  key: "progress8_ci",
  label: "95% confidence interval",
  indent: true,
  yearTag: true,
  hideOnAvg: true,
  get: (p, year) => {
    const lo = p[`progress8_ci_low_${year}`];
    const hi = p[`progress8_ci_high_${year}`];
    return lo == null || hi == null ? null : [lo, hi];
  },
  format: (v) => (v == null ? "—" : `${v[0].toFixed(2)} to ${v[1].toFixed(2)}`),
};

// Progress 8 by prior-attainment band, driven by the year selector.
const bandRows = BANDS.map((b) => ({
  key: b.key,
  label: b.label,
  indent: true,
  yearTag: true,
  get: (p, year) => p[`${b.key}_${year}`],
  format: (v) => (v == null ? "—" : v.toFixed(2)),
  best: "max",
}));

const textRow = (key, label, get) => ({ key, label, get, format: (v) => v ?? "—" });

const section = (key, label, hint) => ({ key, label, hint, section: true });

const IDENTITY_ROWS = [
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
];

const ROWS = [
  ...IDENTITY_ROWS,
  section("sec_p8", "Progress 8", "Progress from end of primary to GCSE (0 = national average)."),
  ...breakdownRows(METRIC_BY_KEY.progress8),
  p8IntervalRow,
  section("sec_a8", "Attainment 8", "Average GCSE result across 8 qualifications."),
  ...breakdownRows(METRIC_BY_KEY.attainment8),
  section(
    "sec_bands",
    "Progress 8 by prior attainment",
    "Progress made by pupils depending on where they started at the end of primary school."
  ),
  ...bandRows,
  section("sec_gcse", "Other GCSE measures"),
  metricRow(METRIC_BY_KEY.pct_grade5_eng_maths),
  metricRow(METRIC_BY_KEY.ebacc_aps),
  section("sec_att", "Attendance", "Lower is better."),
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

const ordinal = (pct) => `${Math.round(pct)}th`;

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
              if (row.section)
                return (
                  <tr key={row.key} className="cmpsection">
                    <th className="rowlabel" colSpan={schools.length + 1}>
                      {row.label}
                      {row.hint && <span className="cmpsechint"> {row.hint}</span>}
                    </th>
                  </tr>
                );

              if (row.hideOnAvg && year === "avg") return null;

              const values = schools.map((p) => row.get(p, year));
              const pcts = row.getPct ? schools.map((p) => row.getPct(p, year)) : null;
              const best = row.best ? bestIndices(values, row.best) : new Set();
              return (
                <tr key={row.key}>
                  <th className={`rowlabel${row.indent ? " indent" : ""}`}>
                    {row.label}
                    {row.yearTag && <span className="colyear"> {yearLabel(year)}</span>}
                  </th>
                  {values.map((v, i) => (
                    <td key={i} className={best.has(i) ? "best" : ""}>
                      {row.format(v)}
                      {pcts && pcts[i] != null && (
                        <div className="cmppct">{ordinal(pcts[i])} pctile</div>
                      )}
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
