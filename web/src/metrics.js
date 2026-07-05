// Central definition of the performance metrics. Drives the colour-by
// selector, the numeric filters, the legend, and the MapLibre paint expression.

const GREY = "#d9d9d9"; // schools with no value for the active metric

// Sequential green ramp (low -> high) and a diverging ramp for Progress 8.
const SEQ = ["#f7fcf5", "#c7e9c0", "#74c476", "#31a354", "#006d2c"];
const DIV = ["#d73027", "#fc8d59", "#fee08b", "#ffffbf", "#d9ef8b", "#91cf60", "#1a9850"];

export const METRICS = [
  {
    key: "progress8",
    label: "Progress 8",
    short: "P8",
    pctKey: "progress8_pct",
    diverging: true,
    // domain centred on 0 (national average); clamped for colour purposes.
    stops: [
      [-1, DIV[0]], [-0.5, DIV[1]], [-0.25, DIV[2]], [0, DIV[3]],
      [0.25, DIV[4]], [0.5, DIV[5]], [1, DIV[6]],
    ],
    range: [-1.5, 2.6],
    step: 0.01,
    unit: "",
    format: (v) => v.toFixed(2),
  },
  {
    key: "attainment8",
    label: "Attainment 8",
    short: "A8",
    pctKey: "attainment8_pct",
    stops: [[20, SEQ[0]], [35, SEQ[1]], [50, SEQ[2]], [65, SEQ[3]], [80, SEQ[4]]],
    range: [0, 90],
    step: 0.1,
    unit: "",
    format: (v) => v.toFixed(1),
  },
  {
    key: "pct_grade5_eng_maths",
    label: "% grade 5+ English & Maths",
    short: "%5+ E&M",
    pctKey: "pct_grade5_eng_maths_pct",
    stops: [[0, SEQ[0]], [25, SEQ[1]], [50, SEQ[2]], [75, SEQ[3]], [100, SEQ[4]]],
    range: [0, 100],
    step: 1,
    unit: "%",
    format: (v) => `${v.toFixed(0)}%`,
  },
  {
    key: "ebacc_aps",
    label: "EBacc average point score",
    short: "EBacc APS",
    pctKey: "ebacc_aps_pct",
    stops: [[0, SEQ[0]], [2, SEQ[1]], [4, SEQ[2]], [6, SEQ[3]], [8, SEQ[4]]],
    range: [0, 9],
    step: 0.1,
    unit: "",
    format: (v) => v.toFixed(2),
  },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m]));

// Ofsted legacy overall grade -> colour (categorical colour-by option).
export const OFSTED_LEGACY = [
  { value: "Outstanding", color: "#1a9850" },
  { value: "Good", color: "#91cf60" },
  { value: "Requires improvement", color: "#fc8d59" },
  { value: "Inadequate", color: "#d73027" },
];

// 2025 report-card 5-point scale (Achievement etc.) -> colour.
export const REPORT_CARD = [
  { value: "Exceptional", color: "#1a9850" },
  { value: "Strong standard", color: "#91cf60" },
  { value: "Expected standard", color: "#d9ef8b" },
  { value: "Needs attention", color: "#fc8d59" },
  { value: "Urgent improvement", color: "#d73027" },
];

// Build the MapLibre circle-color expression for the active colour dimension.
export function colorExpression(colorBy) {
  if (colorBy === "ofsted") {
    const match = ["match", ["get", "ofsted_overall_legacy"]];
    for (const { value, color } of OFSTED_LEGACY) match.push(value, color);
    match.push(GREY); // default / unrated
    return match;
  }
  const m = METRIC_BY_KEY[colorBy];
  if (!m) return GREY;
  // coalesce missing -> sentinel far outside the range, mapped to grey.
  const SENTINEL = -100000;
  const expr = ["interpolate", ["linear"], ["coalesce", ["get", m.key], SENTINEL], SENTINEL, GREY];
  for (const [stop, color] of m.stops) expr.push(stop, color);
  return expr;
}

// Legend entries for the active colour dimension.
export function legendFor(colorBy) {
  if (colorBy === "ofsted")
    return { title: "Ofsted (legacy overall)", items: OFSTED_LEGACY, categorical: true };
  const m = METRIC_BY_KEY[colorBy];
  return {
    title: m.label,
    categorical: false,
    stops: m.stops.map(([v, c]) => ({ label: m.format(v), color: c })),
  };
}
