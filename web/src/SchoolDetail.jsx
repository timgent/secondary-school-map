import { YEARS, METRIC_BY_KEY } from "./metrics.js";

// Progress 8 prior-attainment bands (pupils grouped by end-of-primary KS2 level).
const BANDS = [
  { key: "progress8_low", label: "Lower starters" },
  { key: "progress8_mid", label: "Middle starters" },
  { key: "progress8_high", label: "Higher starters" },
];

// Detail card for a clicked school. Also the natural home (later) for the
// commute / house-price / jobs enrichment (Milestones 3–4).
export default function SchoolDetail({
  school: p, year, onClose, inCompare, compareFull, onToggleCompare,
}) {
  const p8 = METRIC_BY_KEY.progress8;
  const a8 = METRIC_BY_KEY.attainment8;
  const ages =
    p.age_low != null && p.age_high != null ? `ages ${p.age_low}–${p.age_high}` : null;

  return (
    <div className="detail">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <h3>{p.name}</h3>
      {onToggleCompare && (
        <button
          className={`cmpbtn ${inCompare ? "on" : ""}`}
          onClick={() => onToggleCompare(p.urn)}
          disabled={!inCompare && compareFull}
          title={!inCompare && compareFull ? "Compare list is full (max 5)" : ""}
        >
          {inCompare ? "✓ In compare" : compareFull ? "Compare full (5)" : "+ Add to compare"}
        </button>
      )}
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
              <th key={y.tag} className={y.tag === year ? "sel" : ""}>
                {y.avg ? "3-yr avg" : y.label}
              </th>
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

      {year !== "avg" && p[`progress8_ci_low_${year}`] != null && (
        <p className="ci">
          {YEARS.find((y) => y.tag === year)?.label} Progress 8 95% interval:{" "}
          {fmt(p[`progress8_ci_low_${year}`])} to {fmt(p[`progress8_ci_high_${year}`])}
        </p>
      )}

      {/* Progress 8 by prior-attainment band, year by year + 3-yr average */}
      {BANDS.some((b) => YEARS.some((y) => p[`${b.key}_${y.tag}`] != null)) && (
        <div className="bands">
          <h4>Progress 8 by prior attainment</h4>
          <p className="bandhint">
            How much progress pupils make depending on where they started at the
            end of primary school.
          </p>
          <table className="years bandyears">
            <thead>
              <tr>
                <th></th>
                {YEARS.map((y) => (
                  <th key={y.tag} className={y.tag === year ? "sel" : ""}>
                    {y.avg ? "3-yr avg" : y.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANDS.map((b) => (
                <tr key={b.key}>
                  <th>{b.label}</th>
                  {YEARS.map((y) => {
                    const v = p[`${b.key}_${y.tag}`];
                    return (
                      <td key={y.tag} className={y.tag === year ? "sel" : ""}>
                        {v == null ? "—" : v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {(p.absence_overall != null || p.persistent_absence != null) && (
        <div className="absence">
          <h4>
            Attendance <span className="muted">(2023–24 · lower is better)</span>
          </h4>
          <table>
            <tbody>
              <MetricRow p={p} m={METRIC_BY_KEY.absence_overall} />
              <MetricRow p={p} m={METRIC_BY_KEY.persistent_absence} />
            </tbody>
          </table>
        </div>
      )}

      <Links p={p} />
    </div>
  );
}

// Useful external links for a school. All but the school's own website are
// built from the URN, which every school has; the DfE/Ofsted/GIAS pages are
// canonical so no per-school data is needed beyond the identifier.
function Links({ p }) {
  const urn = p.urn;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${p.name} ${p.postcode ?? ""}`.trim()
  )}`;
  const links = [
    p.website && ["School website", p.website],
    ["Compare school performance", `https://www.compare-school-performance.service.gov.uk/school/${urn}`],
    ["Ofsted reports", `https://reports.ofsted.gov.uk/search?q=${urn}`],
    ["GIAS record", `https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/${urn}`],
    ["Google Maps", maps],
  ].filter(Boolean);
  return (
    <div className="links">
      <h4>Links</h4>
      <ul>
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
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
