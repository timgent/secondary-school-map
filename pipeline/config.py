"""Central configuration for the schools data pipeline.

All external data sources live here so they are easy to update when
government services move (which they do). URLs verified working 2026-07-05.
"""
from __future__ import annotations

from pathlib import Path

# --- paths -------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
RAW.mkdir(parents=True, exist_ok=True)

# Browser-like UA — the gov.uk / GIAS WAFs 403/500 the default requests UA.
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

# --- GIAS (Get Information About Schools) — the master registry ---------------
# Daily "all establishment data" CSV. Path segment /downloads/public/ is
# required; the file exists only for recent dates and HEAD is rejected (use GET).
# {date} is YYYYMMDD. The downloader walks back from today to find a live file.
GIAS_URL_TEMPLATE = (
    "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/"
    "edubasealldata{date}.csv"
)
GIAS_ENCODING = "cp1252"  # GIAS is Windows-1252, not UTF-8

# --- Ofsted management information (state-funded schools) ---------------------
# Collection page lists monthly CSVs; we scrape it and pick the newest-dated
# "latest inspections" file (one row per school, latest full inspection).
OFSTED_COLLECTION_URL = (
    "https://www.gov.uk/government/statistical-data-sets/"
    "monthly-management-information-ofsteds-school-inspections-outcomes"
)
OFSTED_ENCODING = "cp1252"

# --- DfE KS4 (GCSE) performance — Progress 8 etc. -----------------------------
# All-England KS4 "final" CSV from the compare-school-performance download
# service. The direct URL works without walking the wizard; the key detail is
# meta=false (meta=true 404s). regions=0 = all of England in one file.
#
# YEAR CHOICE: Progress 8 needs a KS2 baseline. The 2024/25 GCSE cohort's KS2
# was summer 2020 (SATs cancelled for COVID), so P8 is "NA" for 2024-2025.
# 2023-2024 is the latest year with real Progress 8, so that is the default.
KS4_YEAR = "2023-2024"
KS4_URL_TEMPLATE = (
    "https://www.compare-school-performance.service.gov.uk/download-data"
    "?download=true&regions=0&filters=KS4&fileformat=csv&year={year}&meta=false"
)
KS4_SOURCE: str | None = KS4_URL_TEMPLATE.format(year=KS4_YEAR)
KS4_ENCODING = "utf-8-sig"          # this file is UTF-8 w/ BOM (unlike GIAS/Ofsted)
KS4_RECTYPE = "1"                    # 1 = mainstream school row (2/4 = LA/national)

# Columns we pull from the DfE KS4 "final" file (schema is stable year to year).
KS4_COLUMNS = {
    "URN": "urn",
    "P8MEA": "progress8",              # Progress 8 measure
    "P8CILOW": "progress8_ci_low",     # lower 95% confidence bound
    "P8CIUPP": "progress8_ci_high",    # upper 95% confidence bound
    "ATT8SCR": "attainment8",          # Attainment 8 score
    "PTL2BASICS_95": "pct_grade5_eng_maths",  # % achieving grade 5+ in Eng & Maths
    "EBACCAPS": "ebacc_aps",           # EBacc average point score
}
# Values in KS4 files meaning "no data" -> NaN.
KS4_NA_VALUES = {"NA", "SUPP", "NE", "NEW", "LOWCOV", "NP", "", "-"}

# --- selection scope (v1) -----------------------------------------------------
# England secondary phases. GIAS marks Welsh schools with GOR "Wales (pseudo)".
SECONDARY_PHASES = {"Secondary", "All-through", "16 plus", "Middle deemed secondary"}
EXCLUDE_GOR = {"Wales (pseudo)", "Not Applicable"}

# --- outputs ------------------------------------------------------------------
OUT_PARQUET = DATA / "schools.parquet"
OUT_GEOJSON = DATA / "schools.geojson"

# Numeric metrics we compute national percentiles for (higher = better for all).
METRICS = ["progress8", "attainment8", "pct_grade5_eng_maths", "ebacc_aps"]
