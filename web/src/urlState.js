// Two-way sync between the app's view state and the URL query string, so a
// link captures the current colour dimension, year, and all active filters.
// Only non-default values are written, keeping shared links short and readable,
// e.g. ?color=ofsted&year=avg&funding=independent&f_progress8=top:10
import { defaultFilters, STAGES } from "./filters.js";
import { METRICS, LATEST_YEAR } from "./metrics.js";

const DEFAULT_COLOR = "progress8";

export function encodeState({ colorBy, year, filters }) {
  const q = new URLSearchParams();
  if (colorBy !== DEFAULT_COLOR) q.set("color", colorBy);
  if (year !== LATEST_YEAR) q.set("year", year);

  const ofsted = Object.entries(filters.ofsted).filter(([, v]) => v).map(([k]) => k);
  if (ofsted.length) q.set("ofsted", ofsted.join(","));
  if (ofsted.length && !filters.includeUnrated) q.set("unrated", "0");

  if (filters.selectiveOnly) q.set("selective", "1");
  if (filters.faith !== "all") q.set("faith", filters.faith);
  if (filters.funding !== "all") q.set("funding", filters.funding);

  const stages = STAGES.map((s, i) => (filters.stages[s] ? i : null)).filter((i) => i != null);
  if (stages.length) q.set("stages", stages.join(","));

  for (const m of METRICS) {
    const n = filters.numeric[m.key];
    if (n?.enabled) q.set(`f_${m.key}`, `${n.mode}:${n.value}`);
  }
  return q.toString();
}

export function decodeState(search) {
  const q = new URLSearchParams(search);
  const filters = defaultFilters();

  const colorBy = q.get("color") || DEFAULT_COLOR;
  const year = q.get("year") || LATEST_YEAR;

  const ofsted = q.get("ofsted");
  if (ofsted) for (const g of ofsted.split(",")) if (g in filters.ofsted) filters.ofsted[g] = true;
  if (q.get("unrated") === "0") filters.includeUnrated = false;

  if (q.get("selective") === "1") filters.selectiveOnly = true;
  const faith = q.get("faith");
  if (faith === "faith" || faith === "nonfaith") filters.faith = faith;
  const funding = q.get("funding");
  if (funding === "state" || funding === "independent") filters.funding = funding;

  const stages = q.get("stages");
  if (stages)
    for (const i of stages.split(",")) {
      const s = STAGES[+i];
      if (s) filters.stages[s] = true;
    }

  for (const m of METRICS) {
    const raw = q.get(`f_${m.key}`);
    if (!raw) continue;
    const [mode, val] = raw.split(":");
    if ((mode === "min" || mode === "top") && val !== "" && !Number.isNaN(+val))
      filters.numeric[m.key] = { enabled: true, mode, value: +val };
  }
  return { colorBy, year, filters };
}
