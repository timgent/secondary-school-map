# Implementation prompt — richer KS4 metrics + interpretation-first UX

You are implementing a feature in this repo (an interactive map of England
secondary schools). Read this whole document, then read the files it points to
before writing code. Do **not** guess at the current state — verify it.

---

## 1. The goal in one sentence

Surface the KS4 sub-group breakdowns we already download (Progress 8 by
prior-attainment band, disadvantaged split, subject blocks, cohort size, EBacc
entry, official banding) **and** redesign the UX so a non-expert parent is given
a lot of information but is actively guided toward *what actually matters* when
comparing schools — instead of fixating on a single headline number.

This is as much a **UX / information-design** task as a data task. Treat the
"help the user stay clear on what matters" part as the primary success
criterion, not an afterthought.

---

## 2. Domain background — read this, it drives the whole UX

Two headline GCSE metrics dominate school comparison, and parents routinely
misread them:

- **Attainment 8 (A8)** — the raw average grade a pupil leaves with across 8
  GCSEs. Tells you *where pupils end up*. Heavily correlated with intake
  (affluence, prior attainment) — a "good" A8 can just mean the school admits
  already-high-achieving kids.
- **Progress 8 (P8)** — value added. Each pupil's A8 compared to the national
  average A8 of pupils who had the *same* end-of-primary (KS2) results. Strips
  out the starting point and measures *how much the school moved pupils*. This
  is the better measure of school **quality**, but it is **noisy** and has a
  confidence interval.

The trap the user specifically wants surfaced:

> **High P8 + low A8** = the school takes pupils who arrive behind, accelerates
> them faster than similar-starting peers elsewhere, but they still leave with
> below-average grades.
> **High A8 + mediocre/negative P8** = a school coasting on an advantaged
> intake; great grades, but pupils arguably *underachieved* relative to their
> start.

Neither headline is "king." The genuinely decision-useful metrics — and the
reason this feature exists — are the **sub-group breakdowns**, especially:

1. **P8 by prior-attainment band** (low / middle / high starters). A school can
   post a fine overall P8 while coasting its high attainers and carrying the
   score on low attainers, or vice versa. A parent should look at the band
   *their own child* sits in, not the school average.
2. **P8 for disadvantaged vs non-disadvantaged pupils** — signals whether the
   school lifts everyone or just the already-advantaged.
3. **Confidence intervals & cohort size** — so a parent doesn't over-read a
   number that is statistical noise from a small cohort.
4. **What the data does *not* cover** — attendance, destinations (where pupils
   go next), wellbeing, sixth-form/A-level. The UX must say so, so users don't
   treat the map as the whole picture.

The UX should teach these ideas *in context*, in plain English, not bury them
in a glossary.

---

## 3. Current state of the codebase (verify before trusting)

### Pipeline (`pipeline/`, Python, run with `uv run python -m pipeline.build`)

- `config.py` — all sources & column maps. **Already multi-year**:
  - `KS4_YEARS = ["2023-2024", "2022-2023", "2021-2022"]`, tags `2024/2023/2022`.
  - `KS4_MULTIYEAR_COLUMNS` (P8MEA, P8CILOW, P8CIUPP, ATT8SCR) pulled for every
    year, suffixed → `progress8_2024`, `attainment8_2023`, etc.
  - `KS4_LATEST_COLUMNS` (PTL2BASICS_95 → `pct_grade5_eng_maths`, EBACCAPS →
    `ebacc_aps`) pulled for the **latest year only**, unsuffixed.
  - `MULTIYEAR_METRICS` / `LATEST_METRICS` drive national-percentile columns
    (`*_pct`, 0–100, higher = better) in `build.py`.
- `ks4.py` — `load()` loops years, uses `_extract(df, colmap, suffix)`. This is
  the natural place to add the new sub-group columns.
- `build.py` — merges GIAS + Ofsted + KS4, adds percentiles, writes
  `data/schools.parquet` and `data/schools.geojson`.

### Frontend (`web/`, Vite + React + MapLibre; `cd web && npm run dev`)

- `src/metrics.js` — the single source of truth for metric definitions: colour
  ramps, legend, MapLibre paint expression, `format()`, percentile keys.
- `src/filters.js` — `defaultFilters()` + `applyFilters()`; per-metric numeric
  filter with `min` / `top X%` modes.
- `src/FilterPanel.jsx` — the left panel: colour-by selector, per-metric
  filters, Ofsted / grammar / faith filters, legend.
- `src/SchoolDetail.jsx` — the card shown when a school is clicked. **This is
  the main surface for the new interpretation UX.**
- `src/SchoolMap.jsx`, `App.jsx` — map + state wiring.

### ⚠️ Known inconsistency to resolve first

The pipeline now emits **year-suffixed** P8/A8 columns (`progress8_2024`,
`attainment8_2024`, …) and there is **no unsuffixed `progress8`/`attainment8`**.
But `metrics.js` / `filters.js` / `SchoolDetail.jsx` still read unsuffixed
`progress8`, `attainment8`, `progress8_ci_low/high`. **Confirm** whether the
frontend is currently reading the latest-year data at all. Before building new
features, reconcile this — e.g. have the pipeline also emit unsuffixed aliases
for the latest year, or update the frontend to reference the latest tag
(`config.KS4_LATEST_YEAR`). Pick one approach, keep it consistent, and note it.

Run the pipeline and `npm run dev` to see the real current behaviour before
changing anything.

---

## 4. The data you have (already downloaded, no new source needed)

The KS4 CSV (`data/raw/ks4_2023-2024.csv`, ~428 columns) contains all of the
following. Coverage % is of mainstream rows; headline `P8MEA` itself is ~78%,
so these sub-group columns are available for **virtually every school that has
a headline P8 at all** — adding them costs almost no extra missing-data.

| Concept | Source column(s) | Coverage | Suggested tidy name |
|---|---|---|---|
| P8, low prior attainers | `P8MEA_LO` (+ `P8CILOW_LO`,`P8CIUPP_LO`) | 74% | `progress8_low` (+ `_ci_low/high`) |
| P8, middle prior attainers | `P8MEA_MID` (+ CIs) | 78% | `progress8_mid` |
| P8, high prior attainers | `P8MEA_HI` (+ CIs) | 77% | `progress8_high` |
| P8, disadvantaged pupils | `P8MEA_FSM6CLA1A` (+ CIs) | 77% | `progress8_disadv` |
| P8, non-disadvantaged | `P8MEA_NFSM6CLA1A` (+ CIs) | 77% | `progress8_nondisadv` |
| A8 by band | `ATT8SCR_LO`/`_MID`/`_HI` | 74–78% | `attainment8_low/mid/high` |
| Official P8 banding (categorical) | `P8_BANDING` (*Well above → Well below average*, plus `SUPP`) | 97% | `progress8_banding` |
| P8 by subject block | `P8MEAENG`,`P8MEAMAT`,`P8MEAEBAC`,`P8MEAOPEN` | ~78% | `progress8_english/maths/ebacc/open` |
| EBacc **entry** % (ambition proxy; ≠ the EBacc APS we already have) | `PTEBACC_E_PTQ_EE` | 97% | `ebacc_entry_pct` |
| Cohort size | `TOTPUPS`, `P8PUP` | 98% | `cohort_size`, `progress8_cohort` |

Notes:
- `KS4_NA_VALUES` in config already maps `NA/SUPP/NE/NEW/LOWCOV/NP/-` → NaN for
  numeric columns. `P8_BANDING` is **categorical text** — keep it as a string,
  and treat `SUPP` as "not available".
- Pull sub-group columns for the **latest year only** (keep the geojson lean and
  avoid a combinatorial multi-year × sub-group explosion). Put them in a new
  `KS4_SUBGROUP_COLUMNS` dict extracted when `i == 0` in `ks4.load()`.
- Add the band and disadvantaged P8 columns to the percentile set so "top X%"
  filtering works on them.
- Watch **geojson size** (`build.py` prints MB). ~15 new mostly-numeric props ×
  ~3.7k features is fine, but confirm it doesn't balloon; drop the subject-block
  or CI columns first if size becomes a problem.

**Not in this file** (do not fabricate; state as "not yet available" in the UI):
attendance / persistent absence, destinations (sustained education/employment),
post-16 / A-level. These are separate DfE releases for a future milestone.

---

## 5. What to build — UX design (the important half)

Guiding principle: **progressive disclosure with guided interpretation.** Show
the headline, but every number is accompanied by a plain-English reading and the
interface nudges the user toward the sub-group view relevant to *their* child.
More data, less confusion.

### 5a. "Pupils like mine" prior-attainment band control (highest value)

Add a small control (in the filter panel, near colour-by) letting the user pick
where their child sits at end of primary:

> **My child is roughly a…** ◦ lower ◦ middle ◦ higher attainer (KS2) · ◦ all pupils (default)

When a band is chosen:
- The **colour-by Progress 8** option recolours using `progress8_low/mid/high`
  for that band instead of the overall figure.
- Filters and the detail card highlight that band's row.
- Show a one-line explainer: *"Coloured by how much progress the school makes
  with **lower-attaining** pupils specifically — the group your child is in."*

This directly operationalises the core insight and is the feature's headline.

### 5b. Redesign the detail card (`SchoolDetail.jsx`) into interpreted sections

Replace the flat metric table with grouped, captioned sections. Each number gets
a plain-English gloss. Suggested structure:

1. **Headline** — school name, type, the official `progress8_banding` word as a
   coloured chip (e.g. "Well above average progress"), and A8 with its national
   percentile.
2. **"Does the school add value?"** — overall P8 with its 95% interval, and an
   auto-generated sentence interpreting it, e.g.:
   - CI entirely above 0 → *"Confidently above average — pupils make more
     progress here than similar pupils nationally."*
   - CI straddles 0 → *"Around the national average; the difference isn't
     statistically clear."*
   - CI entirely below 0 → *"Below average progress."*
3. **"For pupils like mine"** — the low/mid/high P8 mini-table, the user's chosen
   band highlighted. Flag divergence, e.g. *"Strong for lower attainers (+0.9)
   but only average for higher attainers (+0.1)."*
4. **"The P8 vs A8 story"** — when P8 is strong but A8 percentile is low, spell
   out the exact trap from §2 in one sentence. And the mirror case.
5. **"Fairness"** — disadvantaged vs non-disadvantaged P8 side by side, with the
   gap called out.
6. **"Where progress comes from"** (optional, collapsible) — subject-block P8
   (English / Maths / EBacc / Open).
7. **Confidence & caveats** — cohort size; a warning when the cohort is small
   or the CI is wide ("based on N pupils — treat with caution"); a persistent
   note that this is GCSE data for one year and does **not** include attendance,
   destinations, wellbeing or sixth-form results.

Keep it skimmable: headline + interpretation always visible, detail collapsible.

### 5c. Colour-by & filters (`metrics.js`, `filters.js`, `FilterPanel.jsx`)

- Add colour-by options for the new metrics, driven by the band control in 5a.
- Add `progress8_banding` as a **categorical** colour-by (reuse the existing
  categorical legend path used for Ofsted; map the 5 banding words to the
  diverging ramp already in `metrics.js`).
- Add numeric filters (min / top X%) for band P8 and disadvantaged P8.
- Add an EBacc-entry-% filter/colour option.
- Do not overwhelm the panel: group the sub-group options under a collapsible
  "Progress by pupil group" subsection rather than adding ~10 flat rows.

### 5d. Make jargon self-explaining

- A short, dismissible intro ("How to read this map") stating the P8/A8
  distinction in 3–4 sentences, and that no single number decides a good school.
- Tooltips / info affordances on "Progress 8", "Attainment 8", "prior
  attainment band", "disadvantaged (FSM6)", "confidence interval".
- Keep copy plain and parent-facing, not statistical.

---

## 6. Constraints & guardrails

- **Don't invent data.** If a value is missing/suppressed show "—" or "not
  available", never a placeholder number. Absent families (attendance,
  destinations) must be labelled as not-yet-available, not omitted silently.
- **Respect confidence intervals and cohort size** — the UX must actively
  discourage over-reading noisy figures; this is a stated requirement.
- **Match existing code style** — `metrics.js` is the single source of truth for
  metric config; add there rather than hard-coding in components. Follow the
  existing multi-year suffix conventions in the pipeline.
- **Keep the geojson lean** (see §4). Check the printed size after building.
- **Reconcile the suffix inconsistency first** (§3) so you're building on solid
  ground.
- No new external data sources. No backend. Everything stays static-geojson +
  client-side filtering.

---

## 7. Suggested order of work

1. Run the pipeline and the web app as-is; confirm current behaviour and the
   §3 suffix inconsistency. Decide and apply the reconciliation.
2. Pipeline: add `KS4_SUBGROUP_COLUMNS` (+ banding + subject blocks + cohort +
   ebacc entry) in `config.py`; extract in `ks4.load()` for the latest year;
   add the relevant new metrics to the percentile set. Rebuild; sanity-check
   coverage and geojson size.
3. Frontend data plumbing: extend `metrics.js` (new metric defs, categorical
   banding, band-aware colour-by).
4. Detail card redesign (§5b) — the biggest UX payoff.
5. "Pupils like mine" band control (§5a) + colour/filter wiring.
6. Filter-panel additions (§5c) and jargon affordances (§5d).
7. Update `README.md` data-notes and the "Colour by" / detail-card descriptions.

---

## 8. Acceptance criteria

- Pipeline emits the new sub-group columns; `build.py` runs clean; coverage of
  band/disadvantaged P8 ≈ overall P8 (~74–78%); geojson size sane.
- A user can colour the map by P8 for a chosen prior-attainment band, and by the
  official P8 banding, with correct legends.
- Clicking a school shows the interpreted, sectioned card with: overall P8 + CI
  in plain English; low/mid/high band P8; disadvantaged gap; a P8-vs-A8
  interpretation when they diverge; cohort-size / wide-CI caution; and an
  explicit note of what the data does *not* cover.
- Numeric filters work for the new band and disadvantaged metrics (min and
  top X%).
- Jargon has plain-English explanations; nothing shows fabricated numbers for
  missing data.
- The panel/card stay uncluttered via collapsible grouping and progressive
  disclosure — a first-time parent can reach a sensible read in under a minute.
