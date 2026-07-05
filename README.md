# England Secondary Schools — Interactive Map

An interactive map of England's secondary schools with flexible filtering and
colour-coding by performance, plus enrichment (commute, house-price equivalent,
local jobs). See the plan and progress below.

## Status

**Milestone 1 — data pipeline: working.** Produces `data/schools.geojson`
(3,703 open England secondary schools) and `data/schools.parquet`, joining:

| Source | Gives us | Status |
|--------|----------|--------|
| **GIAS** (Get Information About Schools) | registry, location, type, phase, selective/faith flags, LA/region | ✅ live |
| **Ofsted MI** (state-funded schools) | legacy 4-point overall grade + 2025 report-card grades | ✅ live |
| **DfE KS4** (GCSE) | Progress 8, Attainment 8, %5+ Eng&Maths, EBacc APS | ✅ live (2023-24) |

3,282 of 3,703 schools have a Progress 8 score; national percentiles are
computed for "top X%" filtering.

**Milestone 2 — map frontend: working.** A Vite + React + MapLibre app in
`web/` renders all schools on a free CARTO basemap, coloured by a chosen metric,
with a filter panel:

- **Colour by** Progress 8 (diverging around 0), Attainment 8, %5+ Eng&Maths,
  EBacc APS, or Ofsted grade — with a live legend.
- **Performance filters** per metric, each toggleable between "value ≥" and
  "top X%" (national percentile) — e.g. *top 10% by Progress 8*.
- **Ofsted** (legacy grades, multi-select), **grammar-only**, and **faith**
  filters.
- **Click a school** for a detail card (all metrics + percentiles, P8
  confidence interval, Ofsted — legacy or 2025 report-card). This card is where
  Milestone 3–4 enrichment (commute, house price, jobs) will live.

Milestones 3 (commute / house-price / catchment) and 4 (jobs enrichment) are
not started.

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
