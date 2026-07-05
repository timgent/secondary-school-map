import { useEffect, useRef, useState } from "react";
import { METRICS, OFSTED_LEGACY, YEARS, legendFor, yearLabel } from "./metrics.js";
import { STAGES } from "./filters.js";
import SearchBox from "./SearchBox.jsx";

export default function FilterPanel({
  filters, setFilters, colorBy, setColorBy, year, setYear, count, total,
  features, onPick, onGoToPlace,
}) {
  const update = (fn) => setFilters((prev) => { const next = structuredClone(prev); fn(next); return next; });

  return (
    <aside className="panel">
      <h1>England Secondary Schools</h1>
      <p className="count">
        <b>{count.toLocaleString()}</b> of {total.toLocaleString()} schools shown
      </p>

      <SearchBox features={features} onPick={onPick} onGoToPlace={onGoToPlace} />

      <section>
        <h2>Colour by</h2>
        <select value={colorBy} onChange={(e) => setColorBy(e.target.value)}>
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
          <option value="ofsted">Ofsted (legacy overall)</option>
          <option value="funding">Funding (state / independent)</option>
        </select>
        <Legend colorBy={colorBy} />
      </section>

      <section>
        <h2>Year — Progress 8 &amp; Attainment 8</h2>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          {YEARS.map((y) => (
            <option key={y.tag} value={y.tag}>{y.label}</option>
          ))}
        </select>
        <p className="hint">Applies to Progress 8 / Attainment 8 colouring &amp; filters.</p>
      </section>

      <section>
        <h2>Performance filters</h2>
        {METRICS.map((m) => (
          <NumericFilter
            key={m.key}
            metric={m}
            state={filters.numeric[m.key]}
            update={update}
            yearLabel={m.multiYear ? yearLabel(year) : null}
          />
        ))}
      </section>

      <section>
        <h2>Ofsted (legacy overall)</h2>
        {OFSTED_LEGACY.map((o) => (
          <label key={o.value} className="check">
            <input
              type="checkbox"
              checked={filters.ofsted[o.value]}
              onChange={(e) => update((f) => (f.ofsted[o.value] = e.target.checked))}
            />
            <span className="swatch" style={{ background: o.color }} />
            {o.value}
          </label>
        ))}
        <label className="check muted">
          <input
            type="checkbox"
            checked={filters.includeUnrated}
            onChange={(e) => update((f) => (f.includeUnrated = e.target.checked))}
          />
          also include schools with no legacy grade
        </label>
      </section>

      <section>
        <h2>Age range covered</h2>
        {STAGES.map((s) => (
          <label key={s} className="check">
            <input
              type="checkbox"
              checked={filters.stages[s]}
              onChange={(e) => update((f) => (f.stages[s] = e.target.checked))}
            />
            {s}
          </label>
        ))}
        <p className="hint">Tick none to include all. “16–19 only” = sixth-form / college.</p>
      </section>

      <section>
        <h2>School type</h2>
        <label className="row">
          Funding:
          <select
            value={filters.funding}
            onChange={(e) => update((f) => (f.funding = e.target.value))}
          >
            <option value="all">All</option>
            <option value="state">State-funded only</option>
            <option value="independent">Independent (private) only</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={filters.selectiveOnly}
            onChange={(e) => update((f) => (f.selectiveOnly = e.target.checked))}
          />
          Selective admissions only
        </label>
        <label className="row">
          Faith:
          <select
            value={filters.faith}
            onChange={(e) => update((f) => (f.faith = e.target.value))}
          >
            <option value="all">All</option>
            <option value="faith">Faith schools only</option>
            <option value="nonfaith">Non-faith only</option>
          </select>
        </label>
      </section>

      <p className="foot">
        Progress 8 &amp; Attainment 8 for 2021–22 to 2023–24; other GCSE data 2023–24
        (DfE). Ofsted MI latest. “Top X%” is national.
      </p>
    </aside>
  );
}

function NumericFilter({ metric, state, update, yearLabel }) {
  const set = (fn) => update((f) => fn(f.numeric[metric.key]));
  const [lo, hi] = metric.range;
  const cmp = metric.lowerBetter ? "max" : "min"; // value-comparison mode
  return (
    <div className={`numfilter ${state.enabled ? "on" : ""}`}>
      <label className="check">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => set((s) => (s.enabled = e.target.checked))}
        />
        <b>{metric.label}</b>
        {yearLabel && <span className="yeartag">{yearLabel}</span>}
      </label>
      {state.enabled && (
        <div className="numctl">
          <select
            value={state.mode}
            onChange={(e) =>
              set((s) => {
                s.mode = e.target.value;
                // reset to a sensible default for the new mode so we never
                // e.g. carry a "value ≥ 0" over into "top 0%".
                s.value =
                  s.mode === "top" ? 10
                  : metric.lowerBetter ? hi
                  : metric.diverging ? 0 : lo;
              })
            }
          >
            <option value={cmp}>{metric.lowerBetter ? "value ≤" : "value ≥"}</option>
            <option value="top">{metric.lowerBetter ? "best %" : "top %"}</option>
          </select>
          {state.mode !== "top" ? (
            <>
              <input
                type="range"
                min={lo}
                max={hi}
                step={metric.step}
                value={state.value}
                onChange={(e) => set((s) => (s.value = +e.target.value))}
              />
              <NumberBox
                min={lo}
                max={hi}
                step={metric.step}
                value={state.value}
                unit={metric.unit}
                onValue={(v) => set((s) => (s.value = v))}
              />
            </>
          ) : (
            <>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={state.value}
                onChange={(e) => set((s) => (s.value = +e.target.value))}
              />
              <NumberBox
                min={1}
                max={100}
                step={1}
                value={state.value}
                unit="%"
                prefix={metric.lowerBetter ? "best" : "top"}
                onValue={(v) => set((s) => (s.value = v))}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Number input kept in two-way sync with the slider. Typing updates the
// filter live (clamped to range); moving the slider updates this box.
function NumberBox({ value, min, max, step, unit, prefix, onValue }) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  // reflect slider-driven changes when the user isn't typing here
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const clamp = (n) => Math.min(max, Math.max(min, n));

  const commit = (raw) => {
    setText(raw);
    const n = parseFloat(raw);
    if (Number.isFinite(n)) onValue(clamp(n));
  };

  return (
    <span className="numbox">
      {prefix && <span className="pre">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={text}
        onFocus={() => (focused.current = true)}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => {
          focused.current = false;
          const n = parseFloat(text);
          setText(String(Number.isFinite(n) ? clamp(n) : value));
        }}
      />
      {unit && <span className="unit">{unit}</span>}
    </span>
  );
}

function Legend({ colorBy }) {
  const leg = legendFor(colorBy);
  return (
    <div className="legend">
      {leg.categorical
        ? leg.items.map((i) => (
            <span key={i.value} className="legitem">
              <span className="swatch" style={{ background: i.color }} /> {i.value}
            </span>
          ))
        : leg.stops.map((s, i) => (
            <span key={i} className="legitem">
              <span className="swatch" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
    </div>
  );
}
