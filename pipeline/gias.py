"""Load GIAS, filter to open England secondary schools, add lat/lon."""
from __future__ import annotations

import pandas as pd
from pyproj import Transformer

from . import config

# GIAS Easting/Northing are British National Grid (EPSG:27700).
_TRANSFORMER = Transformer.from_crs(27700, 4326, always_xy=True)

_COLS = {
    "URN": "urn",
    "EstablishmentName": "name",
    "PhaseOfEducation (name)": "phase",
    "TypeOfEstablishment (name)": "type",
    "EstablishmentStatus (name)": "status",
    "Easting": "easting",
    "Northing": "northing",
    "Postcode": "postcode",
    "GOR (name)": "region",
    "LA (name)": "local_authority",
    "ReligiousCharacter (name)": "religious_character",
    "AdmissionsPolicy (name)": "admissions_policy",
    "StatutoryLowAge": "age_low",
    "StatutoryHighAge": "age_high",
}


def load() -> pd.DataFrame:
    from .download import fetch_gias
    raw = fetch_gias()
    df = pd.read_csv(raw, encoding=config.GIAS_ENCODING, dtype=str,
                     usecols=list(_COLS)).rename(columns=_COLS)

    # scope: open, England, secondary phase, real coordinates
    df = df[df["status"].str.strip() == "Open"]
    df = df[~df["region"].str.strip().isin(config.EXCLUDE_GOR)]
    df = df[df["phase"].str.strip().isin(config.SECONDARY_PHASES)]

    df["easting"] = pd.to_numeric(df["easting"], errors="coerce")
    df["northing"] = pd.to_numeric(df["northing"], errors="coerce")
    df = df[(df["easting"] > 0) & (df["northing"] > 0)].copy()

    lon, lat = _TRANSFORMER.transform(df["easting"].values, df["northing"].values)
    df["lon"] = lon.round(6)
    df["lat"] = lat.round(6)

    df["urn"] = df["urn"].str.strip()
    df["selective"] = df["admissions_policy"].str.strip().eq("Selective")
    df["has_faith"] = ~df["religious_character"].str.strip().isin(
        ["None", "Does not apply", "", "nan"])

    keep = ["urn", "name", "phase", "type", "region", "local_authority",
            "postcode", "religious_character", "has_faith", "admissions_policy",
            "selective", "age_low", "age_high", "lat", "lon"]
    df = df[keep].reset_index(drop=True)
    print(f"  GIAS: {len(df)} open England secondary schools with coordinates")
    return df
