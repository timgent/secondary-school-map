"""Load DfE pupil absence (latest year) -> per-URN columns.

Overall absence rate and persistent-absentee rate, from the same
compare-school-performance download service used for KS4 (filter=PUPILABSENCE).
Set ``config.ABSENCE_ENABLED = False`` to skip.
"""
from __future__ import annotations

import pandas as pd

from . import config
from .ks4 import _num  # shared NA-aware numeric cleaner


def load() -> pd.DataFrame | None:
    if not config.ABSENCE_ENABLED:
        print("  Absence: disabled (config.ABSENCE_ENABLED) -> skipping")
        return None

    from .download import fetch
    url = config.ABSENCE_URL_TEMPLATE.format(year=config.ABSENCE_YEAR)
    path = fetch(url, f"absence_{config.ABSENCE_YEAR}.csv")
    df = pd.read_csv(path, dtype=str, encoding=config.KS4_ENCODING, low_memory=False)
    df.columns = [c.strip() for c in df.columns]

    out = pd.DataFrame({"urn": df["URN"].astype(str).str.strip()})
    for src, tidy in config.ABSENCE_COLUMNS.items():
        if src in df.columns:
            out[tidy] = _num(df[src])
    out = out[out["urn"].str.isdigit()].drop_duplicates("urn")

    n = out[config.ABSENCE_METRICS[0]].notna().sum()
    print(f"  Absence {config.ABSENCE_YEAR}: {len(out)} schools, {n} with an absence rate")
    return out
