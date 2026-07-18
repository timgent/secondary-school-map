# Premium Feature — Scope & Viability Assessment

*Prepared July 2026. Assesses the paid product recommended in
`monetization-market-analysis.md`: an admissions-likelihood ("will we get
in?") layer + commute overlays, sold first as a one-off School Choice Report.*

---

## 1. The critical question: can we get the data?

**Yes — no restricted datasets needed.** This was the make-or-break risk and it
resolves favourably, in three tiers:

**Tier 1 — DfE applications & offers (free, national, structured).** DfE
publishes school-level admissions pressure annually under OGL: number of 1st /
2nd / 3rd / total preferences and offers per school, as a timeseries back to
2014, downloadable from Explore Education Statistics. This yields an
**oversubscription ratio per school** (1st-choice applications ÷ offers) — a
genuinely useful "how hard is it to get in?" signal — as a straightforward
pipeline join. *Nobody has to scrape anything for this.*

**Tier 2 — "last distance offered" / cut-off distances (free, fragmented).**
For oversubscribed schools with distance-based criteria, the home-to-school
distance of the last child offered a place is the single best predictor of
admission odds. Many LAs publish it (Birmingham publishes three years' worth;
Haringey, Islington, Hackney etc. publish annually) — but coverage is partial
and formats are chaotic (PDFs, web tables, maps, each LA different). Locrating
has blogged about collecting exactly this data laboriously; it is their moat,
built by grunt work. LLM-assisted PDF/table extraction makes replicating it far
cheaper in 2026 than it was for them.

**Tier 3 — oversubscription criteria (free, per school, mostly manual).**
Faith, selective, banded and lottery schools don't admit by distance; for those
the honest product is to *display the criteria and pressure*, not fake a
radius. Criteria live in LA composite prospectuses and school admission
policies — same extraction pipeline as Tier 2.

The pupil-census home-location heat-maps competitors show are **not** required:
Locrating's own blog concedes cut-off distances correlate very closely with
their heat-maps for oversubscribed schools. We can match the utility without
NPD access.

**Commute data:** UK public transport is open (DfT Bus Open Data, open rail
timetables). Options: TravelTime API (fast to integrate, per-query cost,
cacheable — fine at report volumes) or self-hosted OpenTripPlanner/r5 (free,
~1–2 weeks extra setup). No blocker either way.

---

## 2. Scope

Phased so each phase is independently shippable and de-risks the next:

| Phase | What | Effort (FTE) | Risk |
|---|---|---|---|
| **A. Oversubscription data** | Join DfE applications/offers by URN into the pipeline; show pressure ratio + trend on school cards (free tier — it's a hook, not the product) | ~1–2 weeks | Low — structured CSV |
| **B. Cut-off distances, top LAs** | Extraction pipeline (LLM-assisted) for the ~30–40 highest-pressure LAs (London boroughs + big metros ≈ where most admissions anxiety lives); 3-yr history where available; store per school-year | ~3–5 weeks initial, then **annual refresh forever** | Medium — messy sources, partial coverage |
| **C. Likelihood UX** | Distance rings on the map; "from your postcode: Likely / Marginal / Unlikely" per school with 3-yr trend; honest handling of faith/selective/banded (show criteria + pressure instead) | ~2–3 weeks | Low-medium — the hard part is honesty, not code |
| **D. Commute overlays** | Isochrones / door-to-school journey times from home postcode (TravelTime API first, self-host later if volume justifies) | ~2 weeks | Low |
| **E. Report + payments** | One-off £19–25 report: Stripe Payment Link → serverless webhook → generated report → emailed signed link. No auth system (per earlier architecture discussion). Split pipeline output into public + premium datasets | ~2–3 weeks | Low — content design is the real work |

**Total to first revenue: roughly 10–15 FTE-weeks** (phases A→E), i.e. ~3
months focused part-time or ~2 months full-time. Phase B is the only
open-ended item and it's deliberately capped: launch with top-LA coverage and
an honest "coverage map", expand LA-by-LA afterwards. **Ongoing cost:** the
annual refresh of B/A each autumn (budget ~2 weeks/year) — this is real and
permanent, but it is also precisely what makes the dataset defensible.

Out of scope for v1 (correctly): primary schools in the *paid* layer, appeals
data, sibling modelling, house-price layer, national Tier-2 coverage.

---

## 3. Viability

**Product-market fit: strong in principle, validated by the incumbent.**
"Will my child get in from this address?" is the question parents pay to
answer; Locrating charges £8/mo for substantially this and claims 100k+
families. Our version can be *better* in the ways we're already better —
multi-year trends, honesty about uncertainty (distances shift with sibling
cohorts and PANs; we show 3-yr ranges, not a fake precise ring).

**Technical viability: high.** Fits the existing stack (pipeline gains two
sources; static app + a few serverless functions; premium data server-side
only). No component is research-grade.

**Commercial risks, honestly weighed:**

1. **Free substitutes.** The raw cut-off distances are on council websites for
   free. Mitigation: the paid value is aggregation + geocoding + trend + map
   UX + the report — the same reason Locrating sells despite the same facts
   being free. Real but survivable.
2. **Incumbent head start.** Locrating has this data nationally, plus reviews.
   We enter as challenger on UX + statistical honesty + one-off pricing (no
   subscription guilt). Viable as #2; don't expect to displace them.
3. **Partial coverage at launch.** Some buyers' LAs won't be covered.
   Mitigation: check coverage *before* payment (postcode gate), only sell
   where we're good — protects refund rate and reputation.
4. **Accuracy/liability.** A parent could over-trust a "Likely" and miss out.
   Mitigation: ranges not point estimates, explicit caveats, link to the LA
   source, never say "guaranteed". This aligns with the brand position anyway.
5. **Demand seasonality.** Purchases cluster Sept–Oct (applications close 31
   Oct) with a smaller March spike (offer day / appeals). Revenue will be
   lumpy; plan launches for late summer.

**Unit economics sanity check.** At a £19–25 one-off price with near-zero
marginal cost (pennies of API/compute per report): 100k annual visitors (a
modest 2-year SEO outcome) × 1–2% purchase → **£19k–50k/yr** from the report
alone; 300k visitors × 2% → **£120k+/yr**. Consistent with the Year-1/Year-2
projections in the market analysis. Break-even on build effort at roughly
500–800 reports sold.

---

## 4. Verdict

**Viable, and the right thing to build next — with one sequencing rule.** The
feature attacks the highest-willingness-to-pay question, all required data is
legally and practically obtainable, the build is ~10–15 FTE-weeks with no
research risk, and the grunt-work component (LA data extraction) doubles as
the moat. The main structural costs are permanent annual maintenance and
seasonal revenue.

The sequencing rule: **ship Phase A into the free product immediately** —
oversubscription pressure is cheap, national, and makes the free map visibly
better than DfE/Rightmove while seeding demand for the paid answer. Then build
B→E targeting a **late-summer launch** to catch the Sept–Oct application
season; launching in, say, March would waste six months of the demand cycle.
If Phase B's extraction proves slower than expected, cut LA count, not
honesty: a report covering 30 metro LAs with real trend data beats national
coverage of guesses.
