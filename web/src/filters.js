import {
  METRICS,
  METRIC_BY_KEY,
  OFSTED_LEGACY,
  resolveKey,
  resolvePctKey,
} from "./metrics.js";

// Age-coverage buckets (must match pipeline gias._stage output).
export const STAGES = [
  "Secondary (no sixth form)",
  "Secondary with sixth form",
  "All-through (primary + secondary)",
  "16–19 only (sixth form)",
];

export const defaultFilters = () => ({
  // Ofsted legacy grades: value -> selected. Empty selection = no Ofsted filter.
  ofsted: Object.fromEntries(OFSTED_LEGACY.map((o) => [o.value, false])),
  includeUnrated: true, // when an Ofsted grade IS selected, also keep unrated?
  selectiveOnly: false,
  faith: "all", // all | faith | nonfaith
  funding: "all", // all | state | independent
  stages: Object.fromEntries(STAGES.map((s) => [s, false])), // empty = all
  // per-metric numeric filter: { enabled, mode: 'min'|'top', value }
  numeric: Object.fromEntries(
    METRICS.map((m) => [
      m.key,
      { enabled: false, mode: m.diverging ? "min" : "top", value: m.diverging ? 0 : 10 },
    ])
  ),
});

export function applyFilters(features, f, year) {
  const ofstedSelected = Object.entries(f.ofsted)
    .filter(([, on]) => on)
    .map(([v]) => v);
  const stageSelected = Object.entries(f.stages)
    .filter(([, on]) => on)
    .map(([s]) => s);
  const numeric = Object.entries(f.numeric).filter(([, n]) => n.enabled);

  return features.filter((feat) => {
    const p = feat.properties;

    if (ofstedSelected.length) {
      const g = p.ofsted_overall_legacy;
      const ok = ofstedSelected.includes(g) || (f.includeUnrated && !g);
      if (!ok) return false;
    }
    if (f.selectiveOnly && !p.selective) return false;
    if (f.faith === "faith" && !p.has_faith) return false;
    if (f.faith === "nonfaith" && p.has_faith) return false;
    if (f.funding === "state" && p.funding !== "State-funded") return false;
    if (f.funding === "independent" && p.funding !== "Independent") return false;
    if (stageSelected.length && !stageSelected.includes(p.stage)) return false;

    for (const [key, n] of numeric) {
      const m = METRIC_BY_KEY[key];
      const val = p[resolveKey(m, year)];
      if (n.mode === "min") {
        if (val == null || val < n.value) return false;
      } else if (n.mode === "max") {
        // lower-is-better metrics (absence): keep schools at or below the value
        if (val == null || val > n.value) return false;
      } else {
        // top X% nationally: percentile must be >= (100 - X)
        const pct = p[resolvePctKey(m, year)];
        if (pct == null || pct < 100 - n.value) return false;
      }
    }
    return true;
  });
}
