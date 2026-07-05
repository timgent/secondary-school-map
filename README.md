# England Secondary Schools — Interactive Map

An interactive map of England's secondary schools with flexible filtering and
colour-coding by performance, plus enrichment (commute, house-price equivalent,
local jobs). See the plan and progress below.

## Status

**Milestone 1 — data pipeline: working.** Produces `data/schools.geojson`
(4,643 England secondary schools — state-funded + independent) and
`data/schools.parquet`, joining:

| Source | Gives us | Status |
|--------|----------|--------|
| **GIAS** (Get Information About Schools) | registry, location, type, phase, funding, selective/faith flags, age range, LA/region | ✅ live |
| **Ofsted MI** (state-funded schools) | legacy 4-point overall grade + 2025 report-card grades | ✅ live |
| **DfE KS4** (GCSE) | Progress 8 & Attainment 8 for **3 years** (2021-22…2023-24) + 3-yr average; P8 by prior-attainment band (per year + average); %5+ Eng&Maths, EBacc APS | ✅ live |
| **DfE pupil absence** | overall absence rate + persistent-absence rate (latest year) | ✅ live |

National percentiles are computed for every numeric metric (and the 3-year
average) for "top X%" filtering. ~3,150 schools have a current Progress 8 score
(independent schools and sixth-form-only sites don't report KS4 P8).

**Milestone 2 — map frontend: working.** A Vite + React + MapLibre app in
`web/` renders all schools on a free CARTO basemap, coloured by a chosen metric,
with a filter panel:

- **Map / List modes.** A toggle switches between the map and a **List** view.
  List mode asks for a **centre postcode** (geocoded via postcodes.io) and shows
  the **closest 50 schools** to that point, respecting all active filters. Every
  column — **distance** plus each performance metric — is **sortable** (click a
  header; click again to reverse). The centre postcode and sort column live in
  the URL (`?mode=list&pc=N43LS&sort=progress8:desc`), so a list is shareable.
- **Compare** (works from either mode; the selection carries across them). Pick
  up to **5 schools** — a checkbox in List, or "Add to compare" on a school's
  card — and open a **side-by-side** view lining up funding, type, stage, Ofsted
  and every metric, highlighting the best value in each row. The selection is in
  the URL too (`?compare=1&cmp=100123,100456`).
- **Search** by school name, postcode or area (local authority); picking a
  result flies to the school and opens its card. Typing a **UK postcode** also
  offers "centre map here" (geocoded via postcodes.io) with a marker — handy
  for locating your own home.
- **Colour by** Progress 8 (diverging around 0), Attainment 8, %5+ Eng&Maths,
  EBacc APS, **overall / persistent absence**, Ofsted grade, or funding — with
  a live legend.
- **Year selector** for Progress 8 / Attainment 8: any of the 3 years or the
  **3-year average**, applied to colouring and filters.
- **Performance filters** per metric, each toggleable between "value ≥" and
  "top X%" (national percentile), with a synced slider **and number box**.
  Absence (lower-is-better) uses "value ≤" / "best %" instead.
- **Ofsted** (legacy grades), **funding** (state / independent), **age range /
  stage** (incl. flagging *16–19 sixth-form-only*), **selective**, and **faith**
  filters.
- **Click a school** for a detail card: multi-year P8/A8 with per-year
  percentiles + 3-yr average, P8 confidence interval, **Progress 8 by prior-
  attainment band** (lower/middle/higher starters, per year + average),
  **attendance** (overall + persistent absence), funding, age/stage, Ofsted
  (legacy or 2025 report-card), and **external links** (school website, DfE
  Compare-performance, Ofsted reports, GIAS record, Google Maps).
- **Shareable links**: the colour dimension, year, map centre/zoom and all
  filters live in the URL (`?color=…&year=…&lat=…&lng=…&z=…&f_progress8=top:10`),
  restored on load.

Milestones 3 (commute / house-price / catchment) and 4 (jobs enrichment) are
not started. A fuller "interpretation-first" KS4 UX (disadvantaged-pupil gap,
official P8 banding chip, plain-English P8-vs-A8 guidance, band-aware colour-by)
is specced in `docs/add-subgroup-metrics-prompt.md` and only partly built so far
(3-year average + band breakdown done; the guided-interpretation redesign is not).

### Running the map

```bash
cd web
npm install
npm run dev          # http://localhost:5173  (auto-copies data/schools.geojson)
```

`npm run copy-data` refreshes `web/public/schools.geojson` from the pipeline
output (also run automatically before `dev`/`build`).

## Running the pipeline

```bash
uv sync
uv run python -m pipeline.build      # downloads sources, writes data/schools.{geojson,parquet}
```

Raw downloads are cached in `data/raw/` (gitignored). Sources are resolved live:
the newest GIAS daily file and newest Ofsted "latest inspections" CSV are found
automatically.

## Data notes

- **Join key** is the URN across all sources.
- **Coordinates** come from GIAS Easting/Northing (EPSG:27700), reprojected to
  WGS84 lat/lon with pyproj.
- **Ofsted (2025 change).** Ofsted retired the single "overall effectiveness"
  grade in favour of per-area *report cards* (Achievement, Behaviour,
  Leadership, …) on a 5-point scale (Exceptional → Urgent improvement). Schools
  last inspected before that keep a legacy 4-point grade (Outstanding → Inadequate).
  Both are captured; `ofsted_framework` says which applies to each school.
  ~48% currently have neither (recently opened, or inspected under a predecessor
  URN on conversion to academy — a future refinement is to follow "URN at time
  of latest full inspection").
- **Percentiles.** Each numeric metric gets a national `*_pct` column (0–100,
  higher = better) for "top X%" filtering.

## KS4 / Progress 8 — notes

- The download URL is the compare-school-performance service's direct link
  (`?download=true&regions=0&filters=KS4&fileformat=csv&year=…&meta=false`).
  The critical param is `meta=false` — `meta=true` 404s.
- **Year = 2023-2024, deliberately.** Progress 8 needs a KS2 baseline; the
  2024/25 GCSE cohort's KS2 was summer 2020 (SATs cancelled for COVID), so
  P8 is `NA` for 2024-25. 2023-24 is the latest year with real Progress 8.
  To change year, set `KS4_YEAR` in `pipeline/config.py`.
- Suppressed/low-coverage values (`NA`, `SUPP`, `NE`, `LOWCOV`, …) become NaN.

## Layout

```
pipeline/   config.py · download.py · gias.py · ofsted.py · ks4.py · build.py
data/       schools.geojson · schools.parquet   (raw/ is gitignored)
web/        (map frontend — Milestone 2, not started)
```
