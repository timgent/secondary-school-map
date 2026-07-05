"""Build the enriched schools dataset: GIAS + Ofsted (+ KS4) -> geojson/parquet.

Run:  uv run python -m pipeline.build
"""
from __future__ import annotations

import json

import pandas as pd

from . import config, gias, ks4, ofsted


def _metric_columns() -> list[str]:
    """All numeric metric columns we want national percentiles for."""
    cols = list(config.LATEST_METRICS)
    for base in config.MULTIYEAR_METRICS:
        for tag in config.KS4_YEAR_TAG.values():
            cols.append(f"{base}_{tag}")
    return cols


def _add_percentiles(df: pd.DataFrame) -> pd.DataFrame:
    """National percentile (0-100, higher = better) for each metric present."""
    for m in _metric_columns():
        if m in df.columns and df[m].notna().any():
            df[f"{m}_pct"] = (df[m].rank(pct=True) * 100).round(1)
    return df


def build() -> pd.DataFrame:
    print("[1/4] GIAS")
    df = gias.load()

    print("[2/4] Ofsted")
    df = df.merge(ofsted.load(), on="urn", how="left")

    print("[3/4] KS4 performance")
    ks4_df = ks4.load()
    if ks4_df is not None:
        df = df.merge(ks4_df, on="urn", how="left")

    print("[4/4] Percentiles + outputs")
    df = _add_percentiles(df)

    df.to_parquet(config.OUT_PARQUET, index=False)
    print(f"  wrote {config.OUT_PARQUET} ({len(df)} rows, {len(df.columns)} cols)")

    _write_geojson(df)
    return df


def _clean(v):
    """Coerce numpy / pandas scalars to plain JSON-serialisable Python values."""
    if pd.isna(v):
        return None
    return v.item() if hasattr(v, "item") else v


def _write_geojson(df: pd.DataFrame) -> None:
    features = []
    for row in df.itertuples(index=False):
        d = row._asdict()
        lon, lat = d.pop("lon"), d.pop("lat")
        props = {k: _clean(v) for k, v in d.items()}
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": props,
        })
    fc = {"type": "FeatureCollection", "features": features}
    config.OUT_GEOJSON.write_text(json.dumps(fc))
    size_mb = config.OUT_GEOJSON.stat().st_size / 1e6
    print(f"  wrote {config.OUT_GEOJSON} ({len(features)} features, {size_mb:.1f} MB)")


def _summary(df: pd.DataFrame) -> None:
    print("\n=== SANITY SUMMARY ===")
    print(f"schools: {len(df)}")
    print("\nby region:")
    print(df["region"].value_counts().to_string())
    print("\nOfsted legacy overall coverage:")
    print(df["ofsted_overall_legacy"].value_counts(dropna=False).to_string())
    print("\nOfsted framework split:")
    print(df["ofsted_framework"].value_counts(dropna=False).to_string())
    if "ofsted_achievement" in df.columns:
        print("\n2025 report-card Achievement grade:")
        print(df["ofsted_achievement"].value_counts(dropna=False).to_string())
    print("\nfunding:")
    print(df["funding"].value_counts(dropna=False).to_string())
    print("\nstage (age coverage):")
    print(df["stage"].value_counts(dropna=False).to_string())
    print(f"\nselective (grammar) schools: {int(df['selective'].sum())}")
    print(f"faith schools: {int(df['has_faith'].sum())}")

    latest_tag = config.KS4_YEAR_TAG[config.KS4_LATEST_YEAR]
    p8_cols = [f"progress8_{t}" for t in config.KS4_YEAR_TAG.values()]
    print("\nProgress 8 coverage by year:")
    for c in p8_cols:
        if c in df.columns:
            print(f"  {c}: {int(df[c].notna().sum())} schools")
    latest_p8 = f"progress8_{latest_tag}"
    if latest_p8 in df.columns and df[latest_p8].notna().any():
        print(f"\ntop 10 by Progress 8 ({config.KS4_LATEST_YEAR}):")
        cols = ["name", "local_authority", "funding", latest_p8, f"{latest_p8}_pct"]
        print(df.nlargest(10, latest_p8)[cols].to_string(index=False))


if __name__ == "__main__":
    _summary(build())
