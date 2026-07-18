#!/usr/bin/env python3
"""Generate the example School Choice Report for N4 1AZ.

Performance data: data/schools.geojson (DfE/Ofsted/GIAS pipeline output).
Admissions data: hand-extracted from Haringey / Hackney / Islington council
publications (July 2026) — see SOURCES at bottom of report.
Outputs: a full standalone HTML file (repo) and a head/body-less fragment (artifact).
"""
import json, math, html

SCRATCH = __import__("os").path.dirname(__import__("os").path.abspath(__file__))
schools = {s["urn"]: s for s in json.load(open(f"{SCRATCH}/n4_schools.json"))}

MI = 0.621371
def esc(s): return html.escape(str(s))

# ---------------------------------------------------------------- admissions data
# cut = entry-year -> straight-line cut-off miles (None = offered all applicants)
# cutrange = entry-year -> (min,max) across fair-banding bands
ADM = {
    102153: dict(name="Hornsey School for Girls", borough="Haringey", gender="Girls",
        cut={2022: None, 2023: None, 2024: None, 2025: None, 2026: None}, verdict="likely",
        why="Offered every applicant a place on national offer day in each of the last five years. Girls only."),
    136137: dict(name="Skinners' Academy", borough="Hackney", banded=True,
        apps={2022: 496, 2023: 445, 2024: 401, 2025: 349, 2026: 294}, pan=180,
        cutrange={2022: (0.58, 1.312), 2023: (1.239, 4.376), 2024: (0.663, 4.791),
                  2025: (1.739, 6.606), 2026: (1.456, 1.792)}, verdict="likely",
        why="At 0.66 mi you sat inside every 2025 and 2026 band cut-off. Fair-banded (applicants sit a banding test), and the tightest band in 2024 cut at 0.66 mi — so likely, not certain."),
    131757: dict(name="Park View School", borough="Haringey",
        cut={2022: None, 2023: None, 2024: None, 2025: None, 2026: None}, verdict="likely",
        why="Offered every applicant a place in each of the last five years."),
    133386: dict(name="Greig City Academy", borough="Haringey", faithnote="Church of England; open places available",
        cut={2022: None, 2023: None, 2024: 2.927, 2025: 2.5562, 2026: 1.961}, verdict="likely",
        why="Where a distance cut-off applied it ran 2.0–2.9 mi; you are 0.78 mi away. The cut-off is tightening year on year but you have a large buffer."),
    131690: dict(name="Arts and Media School Islington", borough="Islington",
        nodata=True, verdict="nodata",
        why="Islington publishes cut-offs only for schools that fill on distance; this school has none listed, which usually means all applicants were offered a place. Verify with the school before relying on it."),
    102154: dict(name="Highgate Wood Secondary School", borough="Haringey",
        cut={2022: 0.7686, 2023: 0.7557, 2024: 0.9631, 2025: 1.0224, 2026: 1.167}, verdict="marginal",
        why="You are 1.27 mi away and the 2026 cut-off was 1.17 mi — just short. The cut-off has widened every year since 2023, so this is a genuine maybe: worth a high preference, not a plan."),
    100282: dict(name="All Saints Catholic High School", borough="Hackney", criteria=True,
        verdict="criteria",
        why="Catholic oversubscription criteria come before distance. As Our Lady's High School (2024) it had 202 applications for 120 places but still made non-preference offers. A realistic option for practising Catholic families; ask the school for current pressure."),
    139616: dict(name="Heartlands High School", borough="Haringey",
        cut={2022: 1.0529, 2023: 0.9823, 2024: 1.506, 2025: 1.0298, 2026: 1.19}, verdict="marginal",
        why="You are 1.38 mi away. The cut-off reached you in only one of the last five years (2024: 1.51 mi); in 2026 it was 1.19 mi. Possible in a quiet year — treat as aspirational."),
    143659: dict(name="City of London Academy, Highgate Hill", borough="Islington",
        nodata=True, verdict="nodata",
        why="No cut-off in Islington's published list — the school has not filled on distance in the years published. Verify with the school."),
    140674: dict(name="Mulberry Academy Woodside", borough="Haringey",
        cut={2022: 1.0257, 2023: 1.6422, 2024: None, 2025: None, 2026: None}, verdict="likely",
        why="Offered every applicant a place in each of the last three years."),
    102152: dict(name="Gladesmore Community School", borough="Haringey",
        cut={2022: 0.9048, 2023: 0.8479, 2024: 1.2563, 2025: 5.2496, 2026: None}, verdict="likely",
        why="Offered all applicants in 2026 and cut at 5.2 mi in 2025 — comfortably past your 1.62 mi. Earlier years were tighter, so keep an eye on the trend."),
    102157: dict(name="St Thomas More Catholic School", borough="Haringey", criteria=True,
        cut={2026: 0.219}, verdict="unlikely",
        why="Catholic criteria first, and the 2026 distance cut-off was 0.22 mi against your 1.67 mi. Out of reach unless you qualify high under the faith criteria — and tight even then."),
    100288: dict(name="Stoke Newington School and Sixth Form", borough="Hackney", banded=True,
        apps={2022: 918, 2023: 864, 2024: 807, 2025: 724, 2026: 774}, pan=255,
        cutrange={2022: (0.504, 0.9), 2023: (0.511, 0.911), 2024: (0.589, 0.797),
                  2025: (0.897, 1.766), 2026: (0.754, 0.877)}, verdict="unlikely",
        why="Roughly three applicants per place. 2026 band cut-offs ran 0.75–0.88 mi; you are 1.75 mi away — around twice the cut-off in most bands and years."),
    100448: dict(name="Highbury Fields School", borough="Islington", gender="Girls",
        cut={2023: 0.787, 2024: 0.974, 2025: 0.846}, verdict="unlikely",
        why="Girls only. Cut-offs have sat between 0.79 and 0.97 mi for three years; you are 1.90 mi away."),
    139571: dict(name="Harris Academy Tottenham", borough="Haringey", criteria=True,
        verdict="criteria",
        why="Admits by fair banding with random allocation inside each band, so distance from N4 1AZ neither helps nor rules you out. Strong recent results make it a rational lottery ticket with one preference."),
    102156: dict(name="Alexandra Park School", borough="Haringey",
        cut={2022: 0.458, 2023: 0.515, 2024: 0.5267, 2025: 0.4991, 2026: 0.477}, verdict="unlikely",
        why="The cut-off has been pinned near 0.5 mi for five straight years; you are 2.07 mi away. From this postcode it is effectively closed."),
    102148: dict(name="Fortismere School", borough="Haringey",
        cut={2022: 0.481, 2023: 0.6337, 2024: 1.1532, 2025: 1.1404, 2026: 1.226}, verdict="unlikely",
        why="The cut-off has widened to 1.23 mi but you are 2.21 mi away — still a mile short even in the loosest year."),
}

# resolve URNs present in extraction by name (some URNs above guessed) -----------
by_name = {}
for urn, s in schools.items():
    by_name[s["name"]] = s
def rec(admname):
    for nm, s in by_name.items():
        if admname.lower()[:14] in nm.lower():
            return s
    raise KeyError(admname)

VERD = {
    "likely":   ("Likely",            "good"),
    "marginal": ("Marginal",          "warn"),
    "unlikely": ("Unlikely",          "crit"),
    "criteria": ("Criteria-based",    "neut"),
    "nodata":   ("No published data", "neut"),
}

ORDER = [102153, 136137, 131757, 133386, 131690, 102154, 100282, 139616, 143659,
         140674, 102152, 102157, 100288, 100448, 139571, 102156, 102148]

ROWS = []
for i, urn in enumerate(ORDER):
    a = ADM[urn]
    s = rec(a["name"])
    ROWS.append(dict(n=i + 1, adm=a, s=s, mi=s["dist_km"] * MI))

# ---------------------------------------------------------------- svg helpers
def fmt(v, nd=2):
    return f"{v:.{nd}f}".rstrip("0").rstrip(".")

def cutoff_chart(a, youmi):
    """Bar chart of cut-off distance by entry year, with 'you' reference line."""
    years = [2022, 2023, 2024, 2025, 2026]
    cut = a.get("cut", {})
    cutrange = a.get("cutrange", {})
    vals = [v for v in cut.values() if v] + [v for r in cutrange.values() for v in r]
    top = max(vals + [youmi]) * 1.22
    W, H, L, B, T = 300, 144, 30, 22, 26
    ph = H - B - T
    pw = W - L - 8
    slot = pw / len(years)
    bw = 26
    p = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Cut-off distance by year, miles">']
    yy = H - B - (youmi / top) * ph
    for frac in (0.5, 1.0):
        gy = H - B - frac * ph
        p.append(f'<line x1="{L}" y1="{gy:.1f}" x2="{W-6}" y2="{gy:.1f}" class="grid"/>')
        p.append(f'<text x="{L-4}" y="{gy+3:.1f}" class="tick" text-anchor="end">{fmt(top*frac,1)}</text>')
    p.append(f'<line x1="{L}" y1="{H-B}" x2="{W-6}" y2="{H-B}" class="axis"/>')
    for i, yr in enumerate(years):
        cx = L + slot * i + slot / 2
        has = yr in cut or yr in cutrange
        p.append(f'<text x="{cx:.1f}" y="{H-8}" class="tick" text-anchor="middle">{yr}</text>')
        if yr in cutrange:
            lo, hi = cutrange[yr]
            y1 = H - B - (hi / top) * ph
            y2 = H - B - (lo / top) * ph
            if y2 - y1 < 5: y1 = y2 - 5
            p.append(f'<rect x="{cx-bw/2:.1f}" y="{y1:.1f}" width="{bw}" height="{y2-y1:.1f}" rx="3" class="bar"><title>{yr}: band cut-offs {fmt(lo)}–{fmt(hi)} mi</title></rect>')
            p.append(f'<text x="{cx:.1f}" y="{y1-4:.1f}" class="val" text-anchor="middle">{fmt(hi,1)}</text>')
        elif yr in cut and cut[yr] is not None:
            v = cut[yr]
            bh = max((v / top) * ph, 3)
            y1 = H - B - bh
            p.append(f'<rect x="{cx-bw/2:.1f}" y="{y1:.1f}" width="{bw}" height="{bh:.1f}" rx="3" class="bar"><title>{yr}: cut-off {fmt(v)} mi</title></rect>')
            p.append(f'<text x="{cx:.1f}" y="{y1-4:.1f}" class="val" text-anchor="middle">{fmt(v,2)}</text>')
        elif yr in cut:
            p.append(f'<text x="{cx:.1f}" y="{H-B-6:.1f}" class="open" text-anchor="middle">all<title>{yr}: every applicant offered a place</title></text>')
        elif not has:
            p.append(f'<text x="{cx:.1f}" y="{H-B-6:.1f}" class="na" text-anchor="middle">–</text>')
    p.append(f'<line x1="{L}" y1="{yy:.1f}" x2="{W-6}" y2="{yy:.1f}" class="youline"/>')
    # keyed legend for the you-line, in its own band above the plot
    txt = f"you · {fmt(youmi)} mi"
    tw = len(txt) * 5.7
    p.append(f'<line x1="{W-8-tw-26:.0f}" y1="8" x2="{W-8-tw-8:.0f}" y2="8" class="youline"/>')
    p.append(f'<text x="{W-8}" y="12" class="you" text-anchor="end">{txt}</text>')
    p.append("</svg>")
    return "".join(p)

def p8_chart(s):
    """Diverging bars: Progress 8 by year + 3-yr avg, CI whisker where held."""
    items = [("2022", s["p8"]["2022"], None), ("2023", s["p8"]["2023"], None),
             ("2024", s["p8"]["2024"], s["p8_ci_2024"]), ("3-yr avg", s["p8"]["avg"], None)]
    vals = [v for _, v, _ in items if v is not None]
    cis = [c for _, _, c in items if c and c[0] is not None]
    lo = min([v for v in vals] + [c[0] for c in cis] + [-0.1])
    hi = max([v for v in vals] + [c[1] for c in cis] + [0.1])
    lo, hi = lo - 0.08, hi + 0.14
    W, H, L, B, T = 300, 132, 30, 22, 8
    ph = H - B - T
    pw = W - L - 8
    slot = pw / 4
    bw = 26
    def Y(v): return H - B - ((v - lo) / (hi - lo)) * ph
    y0 = Y(0)
    p = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Progress 8 by year">']
    p.append(f'<line x1="{L}" y1="{y0:.1f}" x2="{W-6}" y2="{y0:.1f}" class="axis"/>')
    p.append(f'<text x="{L-4}" y="{y0+3:.1f}" class="tick" text-anchor="end">0</text>')
    for i, (lab, v, ci) in enumerate(items):
        cx = L + slot * i + slot / 2
        p.append(f'<text x="{cx:.1f}" y="{H-8}" class="tick{" tickb" if lab=="3-yr avg" else ""}" text-anchor="middle">{lab}</text>')
        if v is None:
            p.append(f'<text x="{cx:.1f}" y="{y0-6:.1f}" class="na" text-anchor="middle">–</text>')
            continue
        yv = Y(v)
        cls = "pos" if v >= 0 else "neg"
        y1, hgt = (yv, y0 - yv) if v >= 0 else (y0, yv - y0)
        hgt = max(hgt, 2)
        p.append(f'<rect x="{cx-bw/2:.1f}" y="{y1:.1f}" width="{bw}" height="{hgt:.1f}" rx="3" class="{cls}"><title>{lab}: Progress 8 {v:+.2f}</title></rect>')
        ly = y1 - 5 if v >= 0 else y1 + hgt + 11
        if ci and ci[0] is not None:
            c1, c2 = Y(ci[1]), Y(ci[0])
            p.append(f'<line x1="{cx:.1f}" y1="{c1:.1f}" x2="{cx:.1f}" y2="{c2:.1f}" class="ci"/>')
            p.append(f'<line x1="{cx-5:.1f}" y1="{c1:.1f}" x2="{cx+5:.1f}" y2="{c1:.1f}" class="ci"/>')
            p.append(f'<line x1="{cx-5:.1f}" y1="{c2:.1f}" x2="{cx+5:.1f}" y2="{c2:.1f}" class="ci"/>')
            ly = min(ly, c1 - 5) if v >= 0 else max(ly, c2 + 11)
        p.append(f'<text x="{cx:.1f}" y="{ly:.1f}" class="val" text-anchor="middle">{v:+.2f}</text>')
    p.append("</svg>")
    return "".join(p)

def area_map():
    """Schematic dot map: home + numbered schools + 1/2-mile rings."""
    W, H = 640, 470
    lat0, lon0 = 51.580339, -0.10363
    kx = 111.32 * math.cos(math.radians(lat0)) * MI   # deg lon -> miles
    ky = 110.57 * MI
    SC = 118  # px per mile
    def XY(lat, lon):
        return W / 2 + (lon - lon0) * kx * SC, H / 2 - (lat - lat0) * ky * SC
    p = [f'<svg class="mapsvg" viewBox="0 0 {W} {H}" role="img" aria-label="Schematic map of schools around N4 1AZ">']
    for r, lab in ((1, "1 mile"), (2, "2 miles")):
        p.append(f'<circle cx="{W/2}" cy="{H/2}" r="{r*SC}" class="ring"/>')
        p.append(f'<text x="{W/2 + r*SC*0.7071 - 6:.0f}" y="{H/2 - r*SC*0.7071 - 4:.0f}" class="ringlab" text-anchor="end">{lab}</text>')
    p.append(f'<rect x="{W/2-5}" y="{H/2-5}" width="10" height="10" transform="rotate(45 {W/2} {H/2})" class="home"/>')
    p.append(f'<text x="{W/2}" y="{H/2+22}" class="homelab" text-anchor="middle">N4 1AZ</text>')
    for r in ROWS:
        x, y = XY(r["s"]["lat"], r["s"]["lon"])
        if not (14 < x < W - 14 and 14 < y < H - 14):
            x = min(max(x, 16), W - 16); y = min(max(y, 16), H - 16)
        band = VERD[r["adm"]["verdict"]][1]
        p.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" class="dot {band}"><title>{esc(r["s"]["name"])} — {fmt(r["mi"])} mi</title></circle>')
        p.append(f'<text x="{x:.0f}" y="{y+3.5:.0f}" class="dotn" text-anchor="middle">{r["n"]}</text>')
    p.append("</svg>")
    return "".join(p)

# ---------------------------------------------------------------- fragments
def chip(verdict):
    lab, band = VERD[verdict]
    return f'<span class="chip {band}"><span class="dotmark"></span>{lab}</span>'

def ofsted_txt(s):
    if s["ofsted_legacy"]:
        return s["ofsted_legacy"]
    ach = s["ofsted_new"].get("ofsted_achievement") if s.get("ofsted_new") else None
    return f"{ach} (’25 card)" if ach else "—"

def pctbar(pct, label):
    if pct is None: return ""
    return (f'<div class="pctrow"><span class="pctlab">{label}</span>'
            f'<span class="pcttrack"><span class="pctfill" style="width:{pct:.0f}%"></span></span>'
            f'<span class="pctval">{pct:.0f}th pctile</span></div>')

def statgrid(s):
    def cell(lab, val, sub=""):
        return f'<div class="stat"><div class="statv">{val}</div><div class="statl">{lab}</div>{f"<div class=statsub>{sub}</div>" if sub else ""}</div>'
    a8 = s["a8"]["2024"]
    if s["ofsted_legacy"]:
        ofv, ofsub = s["ofsted_legacy"], "legacy grade"
    else:
        ach = s["ofsted_new"].get("ofsted_achievement") if s.get("ofsted_new") else None
        ofv, ofsub = (ach, "2025 report card") if ach else ("—", "")
    return ('<div class="stats">'
        + cell("Attainment 8", "—" if a8 is None else f"{a8:.1f}")
        + cell("Grade 5+ Eng &amp; Maths", "—" if s["basics"] is None else f'{s["basics"]:.0f}%')
        + cell("Absence", "—" if s["absence"] is None else f'{s["absence"]:.1f}%', "nat. avg ≈ 7.8%")
        + cell("Ofsted", ofv, ofsub)
        + "</div>")

def school_card(r):
    a, s = r["adm"], r["s"]
    tags = [f'{fmt(r["mi"])} mi']
    tags.append(a.get("borough", ""))
    if a.get("gender"): tags.append(a["gender"] + " only")
    if a.get("banded"): tags.append("fair-banded")
    if a.get("faithnote"): tags.append("Church of England")
    if s["stage"] == "Secondary with sixth form": tags.append("sixth form")
    apps = ""
    if a.get("apps"):
        yr = max(a["apps"])
        apps = f'<div class="appline">{a["apps"][yr]} applications for {a["pan"]} places ({yr} entry)</div>'
    admblock = (f'<figure><figcaption>Distance cut-off on offer day, miles</figcaption>{cutoff_chart(a, r["mi"])}{apps}</figure>'
                if (a.get("cut") or a.get("cutrange")) else
                f'<div class="noadm">No distance cut-off published — see note.</div>')
    return f'''<article class="card" id="s{r["n"]}">
  <header class="cardhead">
    <div><span class="cardn">{r["n"]}</span><h3>{esc(s["name"])}</h3>
    <div class="tags">{" · ".join(t for t in tags if t)}</div></div>
    {chip(a["verdict"])}
  </header>
  <p class="why">{a["why"]}</p>
  <div class="charts">
    {admblock}
    <figure><figcaption>Progress 8 (whisker = 95% confidence)</figcaption>{p8_chart(s)}
    {pctbar(s["p8_pct"]["avg"], "3-yr P8")}</figure>
  </div>
  {statgrid(s)}
</article>'''

def compact_row(r):
    a, s = r["adm"], r["s"]
    cuts = [v for v in a.get("cut", {}).values() if v] + [v for rr in a.get("cutrange", {}).values() for v in rr]
    if not cuts:
        cuttxt = "no distance offers"
    elif fmt(min(cuts)) == fmt(max(cuts)):
        cuttxt = f"cut-off {fmt(min(cuts))} mi"
    else:
        cuttxt = f"cut-off {fmt(min(cuts))}–{fmt(max(cuts))} mi"
    p8 = s["p8"]["avg"]
    return (f'<div class="crow"><span class="cardn">{r["n"]}</span>'
            f'<div class="crmain"><strong>{esc(s["name"])}</strong>'
            f'<span class="crsub">{a["why"]}</span></div>'
            f'<div class="crnum">you {fmt(r["mi"])} mi<br><span class="crcut">{cuttxt}</span></div>'
            f'<div class="crnum">P8 {p8:+.2f}<br><span class="crcut">{s["p8_pct"]["avg"]:.0f}th pctile</span></div></div>')

def table():
    rows = []
    for r in ROWS:
        a, s = r["adm"], r["s"]
        notes = ", ".join(x for x in [a.get("gender") and a["gender"] + " only",
                                      a.get("banded") and "banded",
                                      a.get("criteria") and "faith/criteria",
                                      a.get("faithnote") and "CofE"] if x)
        p8, p8p = s["p8"]["avg"], s["p8_pct"]["avg"]
        a8v = s["a8"]["2024"]
        a8txt = "—" if a8v is None else f"{a8v:.1f}"
        rows.append(f'<tr><td class="tn">{r["n"]}</td><td class="tname"><a href="#s{r["n"]}">{esc(s["name"])}</a>'
                    f'{f"<span class=tnote>{notes}</span>" if notes else ""}</td>'
                    f'<td>{a.get("borough","")}</td><td class="num">{fmt(r["mi"])}</td>'
                    f'<td>{chip(a["verdict"])}</td>'
                    f'<td class="num">{"—" if p8 is None else f"{p8:+.2f}"}</td>'
                    f'<td class="num">{"—" if p8p is None else f"{p8p:.0f}"}</td>'
                    f'<td class="num">{a8txt}</td>'
                    f'<td>{ofsted_txt(s)}</td></tr>')
    return ('<div class="tablewrap"><table><thead><tr><th></th><th>School</th><th>Borough</th>'
            '<th class="num">Miles</th><th>Chance from N4&nbsp;1AZ</th><th class="num">P8 3-yr</th>'
            '<th class="num">P8 pctile</th><th class="num">A8 ’24</th><th>Ofsted</th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody></table></div>')

# ---------------------------------------------------------------- assemble
likely   = [r for r in ROWS if r["adm"]["verdict"] == "likely"]
marginal = [r for r in ROWS if r["adm"]["verdict"] == "marginal"]
unlikely = [r for r in ROWS if r["adm"]["verdict"] == "unlikely"]
criteria = [r for r in ROWS if r["adm"]["verdict"] in ("criteria", "nodata")]

CSS = open(f"{SCRATCH}/report.css").read()

body = f'''<style>{CSS}</style>
<div class="scr">
<div class="proto">Prototype for user testing — a sample of the paid School Choice Report. Performance data is real (DfE / Ofsted, 2022–24 results). Admissions figures are real, from Haringey, Hackney and Islington council publications for entry years 2022–2026.</div>

<header class="mast">
  <div class="brand">School Choice Report</div>
  <h1>Secondary schools from <span class="pc">N4 1AZ</span></h1>
  <div class="mastmeta">Harringay / Finsbury Park · prepared 18 July 2026 · for entry September 2027 · apply by 31 October 2026</div>
</header>

<section>
  <h2>The picture in sixty seconds</h2>
  <ul class="sixty">
    <li><strong>You have real, likely options close to home.</strong> Six schools — including three within a mile — have either offered every applicant a place recently or hold cut-offs far beyond your distance.</li>
    <li><strong>The famous names are out of reach on distance.</strong> Fortismere, Alexandra Park and Stoke Newington all cut roughly a mile or more inside where you live, and have for years. Preferences spent there are usually preferences wasted.</li>
    <li><strong>Your strongest realistic academic bets:</strong> Greig City Academy (P8 +0.29, 73rd percentile, ¾&nbsp;mi, likely) — and for a daughter, Hornsey School for Girls (P8 +0.26, rising three years straight, ½&nbsp;mi, likely). Heartlands (P8 +0.40, 80th percentile) is a genuine maybe worth a high preference.</li>
    <li><strong>Harris Academy Tottenham is a rational lottery ticket:</strong> random allocation within bands means distance doesn't rule you out, and its results are strong (P8 +0.33).</li>
  </ul>
</section>

<section>
  <h2>Where you stand</h2>
  <p class="lede">Every state secondary within about 2¼ miles of your door, numbered by distance. The verdicts compare your straight-line distance with each school's published cut-off history — the distance of the last child offered a place on national offer day.</p>
  <div class="maplegendwrap">{area_map()}
  <div class="maplegend">
    <span class="chip good"><span class="dotmark"></span>Likely</span>
    <span class="chip warn"><span class="dotmark"></span>Marginal</span>
    <span class="chip crit"><span class="dotmark"></span>Unlikely</span>
    <span class="chip neut"><span class="dotmark"></span>Criteria / no data</span>
  </div></div>
  {table()}
</section>

<section>
  <h2>Schools you can plan around</h2>
  <p class="lede">From N4 1AZ these are close to safe: they either offered every applicant a place in recent years, or their cut-offs sit far beyond your distance.</p>
  {"".join(school_card(r) for r in likely)}
</section>

<section>
  <h2>Worth a preference, not a plan</h2>
  <p class="lede">You sit just outside these schools' recent cut-offs. Put them high on the form if you like them — a preference costs nothing and never hurts your chances elsewhere — but don't build your plan on an offer.</p>
  {"".join(school_card(r) for r in marginal)}
</section>

<section>
  <h2>Out of realistic reach from this postcode</h2>
  <p class="lede">Popular schools whose cut-offs have sat well inside your distance for years. Listing every one of your six preferences here is the classic mistake: you would likely receive none of them, and be allocated whichever school still has places.</p>
  <div class="crows">{"".join(compact_row(r) for r in unlikely)}</div>
</section>

<section>
  <h2>Different rules apply</h2>
  <div class="crows">{"".join(compact_row(r) for r in criteria)}</div>
</section>

<section>
  <h2>Using your six preferences</h2>
  <p class="lede">You apply once, through your home borough (Haringey eAdmissions), ranking up to six schools across any London borough. Schools never see your ranking; you receive exactly one offer — the highest-ranked school that can take you. The playbook from N4&nbsp;1AZ:</p>
  <ol class="playbook">
    <li><strong>Spend the top of the form on genuine wants, even long shots.</strong> One or two preferences on Heartlands, Highgate Wood or a Harris Tottenham band-lottery are free upside.</li>
    <li><strong>Fill the middle with likely schools you'd be happy with</strong> — Greig City, Skinners', Hornsey (for a daughter) — in your true order of preference.</li>
    <li><strong>Always end with a banker.</strong> Park View or Mulberry Woodside have offered every applicant a place for years. A banker in slot six is what stands between you and being allocated a school you never chose.</li>
    <li><strong>Visit before you rank.</strong> Autumn open evenings run September–October; a school's feel routinely overturns its numbers.</li>
    <li><strong>Check the sibling and faith fine print</strong> — an older sibling on roll in 2027 changes several of these verdicts outright.</li>
  </ol>
</section>

<section class="method">
  <h2>How to read the numbers</h2>
  <p><strong>Progress 8 (P8)</strong> measures GCSE progress against pupils nationally who started from the same point: 0 is average, +0.3 means a third of a grade better in every subject. It is the fairest single measure, but small cohorts swing it — the whiskers show the 95% confidence range, and we show three years so one odd year can't mislead you. <strong>Attainment 8</strong> is raw GCSE points and mostly reflects intake, not teaching. <strong>Percentiles</strong> rank a school among all English state secondaries.</p>
  <p><strong>Cut-off distances</strong> move every year — with sibling numbers, birth-rate dips and admission-number changes. Roughly a third to a half of places go to priority groups (EHCPs, looked-after children, siblings, staff) before distance is applied. Verdicts here compare five years of published cut-offs with your straight-line distance; councils measure from your exact address point, so treat anything within ±0.1&nbsp;mi of a cut-off as genuinely uncertain. Girls' schools apply only to daughters. Nothing on this page is a guarantee of a place.</p>
  <p><strong>Not covered:</strong> independent schools (three sit within a mile), sixth-form-only colleges, and the 2027 admission arrangements, which schools may amend. Always verify criteria in each school's published policy before submitting your form.</p>
</section>

<footer class="src">
  <h2>Sources</h2>
  <p>School performance: DfE performance tables 2021-22 to 2023-24 &amp; pupil absence statistics · Ofsted inspection outcomes &amp; 2025 report cards · GIAS school registry. Admissions: <a href="https://haringey.gov.uk/schools-learning/schools/school-admissions/how-school-place-offers-were-made/cutoff-distance-school-last-child-offered-place/secondary-schools-distance-school-last-child-offered-place-national-offer-day">Haringey cut-off distances 2022–26</a> · <a href="https://education.hackney.gov.uk/sites/default/files/document/Applications%20and%20Offers%20at%20Hackney%20Secondary%20Schools%202018-26.pdf">Hackney applications &amp; offers 2018–26</a> · <a href="https://www.islington.gov.uk/children-and-families/schools/apply-for-a-school-place/school-admissions-information/cut-off-distance-maps">Islington cut-off distances</a>. Geocoding: postcodes.io. Distances are straight-line from the postcode centroid.</p>
  <p class="fine">Sample report generated for product testing. © 2026 — not affiliated with any local authority or the Department for Education.</p>
</footer>
</div>'''

frag = body
full = ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>School Choice Report — N4 1AZ</title></head><body class="standalone">'
        + body + "</body></html>")

open(f"{SCRATCH}/report-fragment.html", "w").write(frag)
open("/home/user/secondary-school-map/docs/examples/school-choice-report-n4-1az.html", "w").write(full)
print("written", len(frag), "chars")
