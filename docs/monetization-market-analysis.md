# Monetisation & Market Analysis — England Secondary Schools Map

*Prepared July 2026. Covers: monetisation ideas, competitor research, market
sizing, overall assessment, recommendation, and expected returns.*

---

## 1. What we have today (starting position)

An England-only interactive map/list of ~4,600 secondary schools with a genuinely
strong data layer: multi-year Progress 8 / Attainment 8 with national
percentiles and confidence intervals, P8 by prior-attainment band, absence data,
Ofsted (legacy + 2025 report cards), rich filtering ("top X%" percentile
filters), compare-up-to-5, shareable URLs. Planned but unbuilt: commute times,
house-price equivalents, catchment estimation, local jobs.

Notable gaps vs. the incumbents (see §3): **no primary schools, no catchment /
admissions-likelihood data, no parent reviews, no A-level/KS5 data, England
only**. The frontend UX and statistical honesty (confidence intervals, banding,
percentiles) are ahead of most competitors; breadth of coverage is behind.

All underlying data is free and public (GIAS, DfE performance tables, Ofsted).
There is **no data moat** — the moat has to come from UX, derived/enriched data
(catchment likelihood, commute), SEO, and brand trust.

---

## 2. Monetisation ideas (brainstorm)

### Consumer (B2C)

1. **Freemium subscription** — free map with basic colouring; pay (~£7–10/mo,
   cancel anytime) for premium filters, compare, multi-year breakdowns,
   catchment likelihood, commute overlays, saved shortlists, admissions-odds
   alerts. This is Locrating's model and the proven price point.
2. **One-off "School Choice Report"** (£15–29) — a generated PDF/interactive
   report for a postcode: every school within reach, honest P8 interpretation,
   admissions realism, commute, house-price context. Fits the *episodic* nature
   of demand (parents care intensely for ~3–6 months, once per child) better
   than a subscription, and one-off pricing captures more value per user than
   1–2 months of £8.
3. **"Moving house for schools" bundle** — postcode-pair comparison ("where
   should we move?"), catchment-aware property-search overlays. Highest
   willingness-to-pay segment (they're about to spend £20k–40k+ extra on a
   house — see §4).
4. **11+/grammar-school module** — selective-school odds, test dates, prep
   resources; affiliate tie-ins to tutoring platforms. Small but high-intent,
   high-spend segment.

### B2B / licensing

5. **Estate-agent map widget/plugin** — embeddable "schools near this property"
   widget sold to agents per branch/month. Locrating already sells exactly this
   (locrating.com/pluginsite), which validates demand; we'd be second in.
6. **Property-portal / proptech data licensing** — the big version of #5.
   *Caveat: School Guide already has an **exclusive** data partnership with
   Rightmove*, so the flagship deal is taken; Zoopla, OnTheMarket, OpenRent,
   relocation-agent platforms and mortgage-broker tools remain.
7. **Relocation & HR services** — corporate relocation firms and international
   schools-search concierges pay well for clean, interpreted school data.
8. **Independent-school marketing** — sponsored/enhanced profiles for the
   ~2,300 independent schools (marketing budgets exist; Ofsted/DfE data doesn't
   sell them, so they want narrative + photos + open-day promotion).
9. **MAT/LA benchmarking dashboards** — sell percentile/band analytics to
   trusts. *Crowded (SchoolDash, Arbor, FFT) and a different product; avoid.*

### Traffic-monetisation (low effort, compounding)

10. **Programmatic SEO + ads/affiliate** — auto-generated pages ("Secondary
    schools in Leeds ranked", "Schools near \<station\>") from the pipeline;
    monetise via display ads and affiliates (tutoring, removals, mortgages,
    conveyancing, uniform). Low ARPU but this is the *acquisition engine* for
    everything above.

---

## 3. Competitor research

| Competitor | Model & price | Strengths | Weaknesses / openings |
|---|---|---|---|
| **Locrating** | Consumer sub **~£8/mo**, cancel anytime; also estate-agent plugin (B2B). Claims 100k+ families rely on it. | The category leader: catchment heat-maps from pupil-census data, admissions data, parent reviews, league tables, nurseries→A-level coverage, property layer. | Dated UI; shallow statistical interpretation (no P8 confidence intervals / prior-attainment bands); users routinely subscribe 1–3 months then cancel. |
| **School Guide** (schoolguide.co.uk) | Premium **£19.95–£29.95**; **exclusive Rightmove data partnership**; Mumsnet partnership. | Distribution: its catchment indicators appear on ~every Rightmove listing; star ratings; parent reviews. | Consumer product weaker than its B2B distribution; ratings are simplistic. |
| **Good Schools Guide** | Subscription + books; editorial reviews. | Brand prestige, human-written reviews, strong in independent-school segment. | Expensive, editorial not data-led; not a map product. |
| **DfE Compare School Performance / Ofsted reports** (free) | Free, official. | Authoritative; where our raw data comes from. | Terrible UX, no map-first exploration, no interpretation — this gap is why the paid category exists at all. |
| **Rightmove School Checker** (free, powered by School Guide) | Free feature inside property search. | Massive reach; "good enough" for casual movers. | Shallow; no serious performance analytics. Caps the casual end of the market. |
| **SchoolDash / FFT / Arbor** | B2B education analytics. | Deep B2B relationships. | Different market (sector professionals, not parents) — a reason to avoid idea #9. |

**Takeaways:** (a) the consumer price ceiling is anchored low (~£8/mo) by
Locrating; (b) the best distribution channel (Rightmove) is exclusively locked
by School Guide; (c) nobody does *interpretation-first* statistics (CIs,
prior-attainment bands, honest "P8 vs A8" guidance) — that's our current edge;
(d) catchment/admissions-likelihood data is table stakes for the paying use
case and we don't have it yet.

---

## 4. Market size

**Demand drivers (England):**

- Secondary school population ≈ **3.23m** (2025 census) → roughly **630–650k
  children per year-group**, i.e. **~600k families apply for a Year 7 place
  every autumn**. A similar-sized cohort chooses primary schools.
- **73% of parents say they'd pay a property premium** for a top catchment
  (Santander, 2025 — up from 63% the year before); average premium they'd
  accept ≈ **15% (~£40k on an average home)**. ONS finds homes in top-decile
  secondary catchments actually cost **~6.8% more**; premiums near Outstanding
  schools run 8–12% (20%+ in London).
- UK residential transactions ≈ **1.0–1.1m/yr**; family movers routinely rank
  schools among the top move criteria.

**Sizing the money:**

- **TAM (consumer):** ~1.2m families/yr entering primary or secondary + a slice
  of movers. If 100% paid £25 once → ~£30m/yr. That's the theoretical ceiling
  for B2C school-choice tools in England.
- **SAM:** realistically only engaged, urban/suburban, admissions-anxious
  parents pay: industry evidence (Locrating's ~100k families, School Guide's
  scale) suggests **£3–8m/yr** is what the paid-consumer niche actually
  supports today, shared among incumbents.
- **SOM (us, 3 years, executed well):** a differentiated #2/#3 player taking
  5–15% of the paid niche plus affiliate/ads → **£150k–600k ARR**. Locrating
  itself (leader, ~15 yrs of SEO) likely sits in the low single-digit £m.
- **B2B side:** thousands of estate-agency branches × ~£20–50/branch/mo widget
  pricing → a plausible **£0.5–2m/yr** segment, but Locrating and School
  Guide's Rightmove deal already occupy the high ground.

**Conclusion on size:** a real but *niche* market — lifestyle-business scale
(£0.1–1m ARR attainable), not venture scale. The adjacent property market is
where the big money is, but its key gate (Rightmove) is contractually locked.

---

## 5. Overall assessment

**Strengths**
- Best-in-category *interpretation* of performance data (CIs, prior-attainment
  bands, percentile filters, 3-yr averages) — genuinely differentiated.
- Free, automatable public-data pipeline → near-zero marginal cost; perfect
  substrate for programmatic SEO.
- Shareable-URL design is viral-friendly (Mumsnet/WhatsApp school-gate sharing).

**Weaknesses / risks**
- **No catchment/admissions data** — the #1 question parents pay to answer is
  "will my child actually get in?", not "is this school good?". Without it, the
  paid proposition is weak. (School-census home-location data underlies
  competitors' heat-maps; sourcing this is the critical build.)
- Missing primary schools halves the audience and cripples SEO breadth.
- Episodic demand → high churn is structural; subscriptions overstate LTV.
- Entrenched incumbents + free "good enough" (Rightmove checker) at the casual
  end; low price anchor (£8/mo).
- No moat in the raw data; moat must be earned via SEO + derived data + brand.
- England-only (fine — admissions systems differ by nation; don't expand early).
- Key-person/side-project risk: SEO plays take 18–24 months to compound.

**Other important considerations**
- **Ofsted's 2025 shift to report cards** scrambles the simple
  "Outstanding = good" heuristic — parents are *more* confused than before,
  which is a tailwind for interpretation-first products and fresh SEO content.
- Ethical positioning matters: "honest statistics" (showing CIs, warning about
  small cohorts and P8 volatility) is both the differentiator and a
  trust/brand asset the incumbents can't easily copy without undermining their
  own league-table framing.
- ONS/DfE licence terms (OGL) permit commercial reuse of the core data — no
  licensing blocker for the current pipeline.

---

## 6. Recommendation

**Build a lifestyle business, not a startup.** Sequence:

1. **Now (0–3 mo): ship free + programmatic SEO.** Deploy the map publicly;
   generate indexable per-school and per-area pages from the pipeline
   (~5,000 school pages + ~350 LA/area pages). Add primary schools (same
   pipeline, KS2 data) to double the surface. Monetise passively with one
   tasteful affiliate/ad slot. Goal: traffic and rankings, not revenue.
2. **Next (3–9 mo): build the paid answer to "will we get in?"** Catchment /
   admissions-likelihood layer + commute overlays (already-planned Milestone 3)
   behind a paywall. Sell a **one-off £19–25 "School Choice Report" first**,
   add an £8/mo sub later — one-off pricing fits episodic demand and undercuts
   nobody-important.
3. **Later (9–18 mo): B2B widget.** Package the map as an embeddable
   estate-agent widget (£25–40/branch/mo) and pitch Zoopla/OnTheMarket-adjacent
   proptechs, since Rightmove is exclusively tied to School Guide.
4. **Avoid:** MAT/school-facing analytics (crowded), paid ads for acquisition
   (CAC will exceed the low LTV), and multi-nation expansion before England
   works.

**Expected returns if executed well** (solo/small-team, part-time-compatible):

| Horizon | Realistic | Stretch (top-decile execution) |
|---|---|---|
| Year 1 | £5k–20k (affiliate + first reports) | £40k |
| Year 2 | £40k–100k ARR | £180k |
| Year 3 | £100k–250k ARR | £400k–600k ARR |

Steady state, this is plausibly a **£100k–300k/yr profit, 90%+ margin**
business (data costs ~nothing; hosting is static files), with modest exit
potential (2–4× revenue to a proptech or Locrating/School Guide themselves).
The stretch case requires winning meaningful SEO share from Locrating plus a
successful B2B widget. It is **not** a venture-scale opportunity — the honest
ceiling for England school-choice B2C is single-digit £m — but as a
high-margin, mission-aligned side business with an already-built data engine,
the risk-adjusted return on the next 6 months of effort is strong.
