"""Load Ofsted management information -> latest rating(s) per URN.

Ofsted replaced the single "overall effectiveness" grade with the 2025 report
-card framework (OEIF). The current MI file therefore carries two systems:

  * legacy 4-point overall grade (col "Latest OEIF overall effectiveness"),
    coded 1-4, for schools last graded under the pre-2025 framework; and
  * new 5-point report-card grades per evaluation area (Achievement,
    Attendance and behaviour, Leadership and governance, ...), worded
    Exceptional / Strong standard / Expected standard / Needs attention /
    Urgent improvement.

We surface both, plus a single ordinal ``ofsted_rank`` (1=worst..N=best) per
system so either can drive a colour gradient. Columns are matched by exact
header name (indices shift year to year).
"""
from __future__ import annotations

import pandas as pd

from . import config

# legacy 4-point overall effectiveness
_LEGACY = {"1": "Outstanding", "2": "Good",
           "3": "Requires improvement", "4": "Inadequate"}
_LEGACY_RANK = {"Outstanding": 4, "Good": 3,
                "Requires improvement": 2, "Inadequate": 1}

# new 2025 report-card 5-point scale (higher = better)
_NEW_RANK = {"Exceptional": 5, "Strong standard": 4, "Expected standard": 3,
             "Needs attention": 2, "Urgent improvement": 1}

# report-card evaluation areas -> tidy column names
_AREAS = {
    "Achievement": "ofsted_achievement",
    "Curriculum and teaching": "ofsted_curriculum",
    "Attendance and behaviour": "ofsted_behaviour",
    "Personal development and wellbeing": "ofsted_personal_dev",
    "Leadership and governance": "ofsted_leadership",
    "Inclusion": "ofsted_inclusion",
}

_LEGACY_COL = "Latest OEIF overall effectiveness"
_UNGRADED_COL = "Ungraded inspection overall outcome"


def _clean(s: pd.Series) -> pd.Series:
    return s.astype(str).str.strip().replace({"NULL": None, "Not judged": None,
                                              "nan": None, "": None})


def load() -> pd.DataFrame:
    from .download import fetch_ofsted_latest
    raw = fetch_ofsted_latest()
    df = pd.read_csv(raw, encoding=config.OFSTED_ENCODING, dtype=str,
                     on_bad_lines="skip")
    df.columns = [c.strip() for c in df.columns]

    out = pd.DataFrame({"urn": df["URN"].astype(str).str.strip()})

    # legacy overall
    legacy = _clean(df[_LEGACY_COL]) if _LEGACY_COL in df.columns else pd.Series(dtype=str)
    out["ofsted_overall_legacy"] = legacy.map(_LEGACY) if len(legacy) else None
    if _UNGRADED_COL in df.columns:
        out["ofsted_ungraded_outcome"] = _clean(df[_UNGRADED_COL])

    # new report-card areas
    has_new = False
    for header, tidy in _AREAS.items():
        if header in df.columns:
            out[tidy] = _clean(df[header])
            has_new = has_new or out[tidy].notna().any()

    # unified framework flag + a single ordinal rank for colouring
    def _framework(row) -> str | None:
        if any(pd.notna(row.get(t)) for t in _AREAS.values()):
            return "report_card_2025"
        if pd.notna(row.get("ofsted_overall_legacy")):
            return "legacy"
        return None

    out["ofsted_framework"] = out.apply(_framework, axis=1)

    # ofsted_rank: report-card Achievement (5-pt) if present else legacy (4-pt).
    # Kept on separate scales; the map treats them per-framework.
    ach = out["ofsted_achievement"] if "ofsted_achievement" in out.columns else pd.Series([None] * len(out))
    out["ofsted_rank_new"] = ach.map(_NEW_RANK)
    out["ofsted_rank_legacy"] = out["ofsted_overall_legacy"].map(_LEGACY_RANK)

    out = out.dropna(subset=["urn"]).drop_duplicates("urn")
    n_legacy = out["ofsted_overall_legacy"].notna().sum()
    n_new = out["ofsted_framework"].eq("report_card_2025").sum()
    print(f"  Ofsted: {len(out)} URNs | {n_legacy} legacy overall | "
          f"{n_new} on 2025 report-card framework")
    return out
