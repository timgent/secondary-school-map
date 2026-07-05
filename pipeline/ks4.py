"""Load DfE KS4 (GCSE) performance for several years -> per-URN columns.

Progress 8 and Attainment 8 are pulled for every year in ``config.KS4_YEARS``
(suffixed by year tag, e.g. ``progress8_2024``); % grade 5+ Eng&Maths and EBacc
APS are pulled for the latest year only. Set ``config.KS4_ENABLED = False`` to
skip KS4 entirely.
"""
from __future__ import annotations

import pandas as pd

from . import config


def _read_year(year: str) -> pd.DataFrame:
    from .download import fetch
    url = config.KS4_URL_TEMPLATE.format(year=year)
    path = fetch(url, f"ks4_{year}.csv")
    df = pd.read_csv(path, dtype=str, encoding=config.KS4_ENCODING, low_memory=False)
    df.columns = [c.strip() for c in df.columns]
    if "RECTYPE" in df.columns:
        df = df[df["RECTYPE"].astype(str).str.strip() == config.KS4_RECTYPE]
    return df


def _num(s: pd.Series) -> pd.Series:
    cleaned = s.astype(str).str.strip().str.replace("%", "", regex=False)
    cleaned = cleaned.where(~cleaned.isin(config.KS4_NA_VALUES))
    return pd.to_numeric(cleaned, errors="coerce")


def _extract(df: pd.DataFrame, colmap: dict[str, str], suffix: str = "") -> pd.DataFrame:
    present = {k: v for k, v in colmap.items() if k in df.columns}
    out = pd.DataFrame({"urn": df["URN"].astype(str).str.strip()})
    for src, tidy in present.items():
        out[f"{tidy}{suffix}"] = _num(df[src])
    return out


def load() -> pd.DataFrame | None:
    if not config.KS4_ENABLED:
        print("  KS4: disabled (config.KS4_ENABLED) -> skipping performance data")
        return None

    merged: pd.DataFrame | None = None
    for i, year in enumerate(config.KS4_YEARS):
        tag = config.KS4_YEAR_TAG[year]
        raw = _read_year(year)

        # Progress 8 / Attainment 8 for this year (suffixed).
        part = _extract(raw, config.KS4_MULTIYEAR_COLUMNS, suffix=f"_{tag}")
        # For the latest year, also pull single-year metrics + P8 band breakdown.
        if i == 0:
            latest = _extract(raw, config.KS4_LATEST_COLUMNS)
            bands = _extract(raw, config.KS4_SUBGROUP_COLUMNS)
            part = part.merge(latest, on="urn", how="outer")
            part = part.merge(bands, on="urn", how="outer")

        part = part[part["urn"].str.isdigit()].drop_duplicates("urn")
        n_p8 = part[f"progress8_{tag}"].notna().sum()
        print(f"  KS4 {year} (tag {tag}): {len(part)} schools, {n_p8} with Progress 8")
        merged = part if merged is None else merged.merge(part, on="urn", how="outer")

    return merged
