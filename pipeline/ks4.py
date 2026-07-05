"""Load DfE KS4 (GCSE) performance -> Progress 8, Attainment 8, etc. per URN.

Source (``config.KS4_SOURCE``) may be:
  * the direct compare-school-performance download URL (default), or
  * a path to a downloaded `*_ks4final.csv` / KS4 zip.

Set ``config.KS4_SOURCE = None`` to build without Progress 8.
"""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pandas as pd

from . import config


def _read_source(src: str) -> pd.DataFrame:
    enc = config.KS4_ENCODING
    if src.startswith("http"):
        from .download import fetch
        src = str(fetch(src, f"ks4_{config.KS4_YEAR}.csv"))
    p = Path(src)
    if p.suffix == ".zip":
        with zipfile.ZipFile(p) as z:
            name = next(n for n in z.namelist() if n.lower().endswith("ks4final.csv"))
            with z.open(name) as fh:
                return pd.read_csv(io.BytesIO(fh.read()), dtype=str,
                                   encoding=enc, low_memory=False)
    return pd.read_csv(p, dtype=str, encoding=enc, low_memory=False)


def _num(s: pd.Series) -> pd.Series:
    cleaned = s.astype(str).str.strip().str.replace("%", "", regex=False)
    cleaned = cleaned.where(~cleaned.isin(config.KS4_NA_VALUES))
    return pd.to_numeric(cleaned, errors="coerce")


def load() -> pd.DataFrame | None:
    if not config.KS4_SOURCE:
        print("  KS4: no source configured (config.KS4_SOURCE) -> skipping "
              "Progress 8 / Attainment 8")
        return None
    df = _read_source(config.KS4_SOURCE)
    df.columns = [c.strip() for c in df.columns]

    # keep mainstream school rows only (drop LA / national aggregate rows)
    if "RECTYPE" in df.columns:
        df = df[df["RECTYPE"].astype(str).str.strip() == config.KS4_RECTYPE]

    present = {k: v for k, v in config.KS4_COLUMNS.items() if k in df.columns}
    if "URN" not in present:
        raise RuntimeError("KS4 file has no URN column")
    out = df[list(present)].rename(columns=present)
    out["urn"] = out["urn"].astype(str).str.strip()
    for col in out.columns:
        if col != "urn":
            out[col] = _num(out[col])

    out = out[out["urn"].str.isdigit()].drop_duplicates("urn")
    n_p8 = out["progress8"].notna().sum() if "progress8" in out.columns else 0
    print(f"  KS4 ({config.KS4_YEAR}): {len(out)} schools, "
          f"{n_p8} with Progress 8, columns: {list(out.columns)}")
    return out
