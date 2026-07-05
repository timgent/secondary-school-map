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
# We pull the 3 most recent years that HAVE Progress 8. The years before that
# (2020-21, 2019-20) were not published due to COVID, so 2021-22 is as far back
# as a continuous run goes.
KS4_YEARS = ["2023-2024", "2022-2023", "2021-2022"]  # newest first
# Short tag per year = the summer GCSEs were sat (academic-year end).
KS4_YEAR_TAG = {y: y.split("-")[1] for y in KS4_YEARS}  # "2023-2024" -> "2024"
KS4_LATEST_YEAR = KS4_YEARS[0]
KS4_URL_TEMPLATE = (
    "https://www.compare-school-performance.service.gov.uk/download-data"
    "?download=true&regions=0&filters=KS4&fileformat=csv&year={year}&meta=false"
)
KS4_ENABLED = True                  # set False to build without any KS4 data
KS4_ENCODING = "utf-8-sig"          # this file is UTF-8 w/ BOM (unlike GIAS/Ofsted)
KS4_RECTYPE = "1"                   # 1 = mainstream school row (2/4 = LA/national)

# Progress 8 & Attainment 8 are pulled for EVERY year in KS4_YEARS; columns get
# a year suffix, e.g. progress8_2024, attainment8_2023.
KS4_MULTIYEAR_COLUMNS = {
    "P8MEA": "progress8",              # Progress 8 measure
    "P8CILOW": "progress8_ci_low",     # lower 95% confidence bound
    "P8CIUPP": "progress8_ci_high",    # upper 95% confidence bound
    "ATT8SCR": "attainment8",          # Attainment 8 score
}
# These are pulled for the LATEST year only (unsuffixed).
KS4_LATEST_COLUMNS = {
    "PTL2BASICS_95": "pct_grade5_eng_maths",  # % achieving grade 5+ in Eng & Maths
    "EBACCAPS": "ebacc_aps",                  # EBacc average point score
}
# Progress 8 broken down by pupils' prior-attainment band (their end-of-primary
# KS2 level). Latest year only, for display on the school detail card.
KS4_SUBGROUP_COLUMNS = {
    "P8MEA_LO": "progress8_low",      # P8 for lower prior-attainment pupils
    "P8MEA_MID": "progress8_mid",     # P8 for middle prior-attainment pupils
    "P8MEA_HI": "progress8_high",     # P8 for higher prior-attainment pupils
}
# Values in KS4 files meaning "no data" -> NaN.
KS4_NA_VALUES = {"NA", "SUPP", "NE", "NEW", "LOWCOV", "NP", "", "-"}

# --- selection scope ----------------------------------------------------------
# State secondary phases. GIAS marks Welsh schools with GOR "Wales (pseudo)".
SECONDARY_PHASES = {"Secondary", "All-through", "16 plus", "Middle deemed secondary"}
EXCLUDE_GOR = {"Wales (pseudo)", "Not Applicable"}
# Independent (private/fee-paying) schools all have phase "Not applicable" in
# GIAS, so we include them separately when their age range covers secondary.
INDEPENDENT_TYPE_GROUP = "Independent schools"
INDEPENDENT_AGE_LOW_MAX = 16       # admits pupils aged <= 16, and ...
INDEPENDENT_AGE_HIGH_MIN = 15      # ... teaches up to at least 15

# --- outputs ------------------------------------------------------------------
OUT_PARQUET = DATA / "schools.parquet"
OUT_GEOJSON = DATA / "schools.geojson"

# Base metrics for national-percentile computation. Multi-year ones expand to
# one column per year tag (e.g. progress8_2024) plus a 3-year average
# (progress8_avg); latest-only stay as-is.
MULTIYEAR_METRICS = ["progress8", "attainment8"]
LATEST_METRICS = ["pct_grade5_eng_maths", "ebacc_aps"]
AVG_TAG = "avg"  # synthetic "year" tag for the multi-year average
