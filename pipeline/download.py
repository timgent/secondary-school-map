"""Downloading + local caching of raw source files."""
from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

import requests

from . import config


def _session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = config.USER_AGENT
    return s


def _cache_path(name: str) -> Path:
    return config.RAW / name


def fetch(url: str, dest_name: str, session: requests.Session | None = None,
          force: bool = False) -> Path:
    """GET ``url`` into data/raw/``dest_name``, cached unless ``force``."""
    dest = _cache_path(dest_name)
    if dest.exists() and not force:
        print(f"  cached  {dest.name} ({dest.stat().st_size:,} bytes)")
        return dest
    session = session or _session()
    print(f"  GET     {url}")
    resp = session.get(url, timeout=120)
    resp.raise_for_status()
    dest.write_bytes(resp.content)
    print(f"  saved   {dest.name} ({len(resp.content):,} bytes)")
    return dest


def fetch_gias(force: bool = False) -> Path:
    """Find and download the most recent live GIAS all-establishments CSV.

    GIAS publishes on weekdays; walk back up to 10 days to find a live file.
    HEAD is rejected by the endpoint, so we issue a small ranged GET to probe.
    """
    session = _session()
    today = dt.date.today()
    for back in range(0, 11):
        day = today - dt.timedelta(days=back)
        url = config.GIAS_URL_TEMPLATE.format(date=day.strftime("%Y%m%d"))
        probe = session.get(url, headers={"Range": "bytes=0-64"}, timeout=60)
        if probe.status_code in (200, 206) and probe.content:
            print(f"  GIAS live file: {day.isoformat()}")
            return fetch(url, f"gias_{day.strftime('%Y%m%d')}.csv",
                         session=session, force=force)
    raise RuntimeError("No live GIAS file found in the last 10 days")


_DATE_RE = re.compile(r"(\d{1,2})[_ ]([A-Za-z]{3})[a-z]*[_ ](\d{4})")
_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


def _parse_date_from_url(url: str) -> dt.date | None:
    m = _DATE_RE.search(url)
    if not m:
        return None
    d, mon, y = m.groups()
    mi = _MONTHS.get(mon.lower()[:3])
    if not mi:
        return None
    try:
        return dt.date(int(y), mi, int(d))
    except ValueError:
        return None


def fetch_ofsted_latest(force: bool = False) -> Path:
    """Scrape the Ofsted collection page and download the newest-dated
    'latest inspections' CSV (one row per school)."""
    session = _session()
    print(f"  GET     {config.OFSTED_COLLECTION_URL}")
    html = session.get(config.OFSTED_COLLECTION_URL, timeout=120).text
    links = re.findall(r'https://[^"\']+latest_inspections[^"\']+\.csv', html)
    dated = [(u, _parse_date_from_url(u)) for u in set(links)]
    dated = [(u, d) for u, d in dated if d is not None]
    if not dated:
        raise RuntimeError("No dated Ofsted 'latest inspections' CSV found")
    url, day = max(dated, key=lambda t: t[1])
    print(f"  Ofsted latest inspections as at {day.isoformat()}")
    return fetch(url, f"ofsted_{day.strftime('%Y%m%d')}.csv",
                 session=session, force=force)
