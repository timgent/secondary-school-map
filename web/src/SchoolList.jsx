import { useMemo, useRef, useState } from "react";
import { METRICS, METRIC_BY_KEY, resolveKey, yearLabel } from "./metrics.js";
import { detectPostcode, geocode } from "./geocode.js";

// Sortable columns for the List view: distance to the centre point, the school
// name, and every performance metric (the same criteria offered as filters).
// `dir` is the DEFAULT sort direction when the column is first selected —
// closest / best first — which the user can then flip by clicking again.
const COLUMNS = [
  { key: "distance", label: "Distance", dir: "asc", numeric: true },
  { key: "name", label: "School", dir: "asc", numeric: false },
  ...METRICS.map((m) => ({
    key: m.key,
    label: m.short,
    // lower-is-better (absence) sorts ascending; everything else best-first.
    dir: m.lowerBetter ? "asc" : "desc",
    numeric: true,
    metric: m,
  })),
];
const COLUMN_BY_KEY = Object.fromEntries(COLUMNS.map((c) => [c.key, c]));

// Value used for sorting a row on a given column; nulls sort last regardless of
// direction.
function sortValue(row, key, year) {
  if (key === "distance") return row.distance;
  if (key === "name") return row.properties.name?.toLowerCase() ?? "";
  const m = METRIC_BY_KEY[key];
  return row.properties[resolveKey(m, year)];
}

function sortRows(rows, sort, year) {
  const col = COLUMN_BY_KEY[sort.key] ?? COLUMN_BY_KEY.distance;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = sortValue(a, sort.key, year);
    const bv = sortValue(b, sort.key, year);
    const an = av == null || Number.isNaN(av);
    const bn = bv == null || Number.isNaN(bv);
    if (an && bn) return a.distance - b.distance; // tie-break by distance
    if (an) return 1; // nulls last
    if (bn) return -1;
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return a.distance - b.distance;
  });
}

export default function SchoolList({
  rows, centre, onCentre, year, sort, setSort, onSelect, total,
  compareUrns, onToggleCompare,
}) {
  const onHeader = (col) => {
    setSort((prev) =>
      prev.key === col.key
        ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: col.dir }
    );
  };

  const sorted = useMemo(
    () => (rows ? sortRows(rows, sort, year) : []),
    [rows, sort, year]
  );

  return (
    <div className="listwrap">
      <div className="listhead">
        <CentreInput centre={centre} onCentre={onCentre} />
        {centre && (
          <p className="listcount">
            {rows.length === 0
              ? "No schools match the current filters near this postcode."
              : <>Closest <b>{sorted.length}</b> of {total.toLocaleString()} schools to{" "}
                  <b>{centre.label}</b> (after filters).</>}
          </p>
        )}
      </div>

      {!centre ? (
        <div className="listempty">
          <p>Enter a postcode above to centre the list.</p>
          <p className="hint">
            The list then shows the closest 50 schools to that point (respecting
            the filters on the left), sortable by distance or any metric.
          </p>
        </div>
      ) : (
        <div className="listscroll">
          <table className="schooltable">
            <thead>
              <tr>
                <th className="cmpcol" title="Select to compare (max 5)">⇄</th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`${col.numeric ? "num" : ""} ${
                      sort.key === col.key ? "sorted" : ""
                    }`}
                    onClick={() => onHeader(col)}
                    title={col.metric ? col.metric.label : col.label}
                  >
                    {col.label}
                    {col.metric?.multiYear && (
                      <span className="colyear">{yearLabel(year)}</span>
                    )}
                    <span className="arrow">
                      {sort.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const p = row.properties;
                const checked = compareUrns.includes(String(p.urn));
                const full = compareUrns.length >= 5;
                return (
                  <tr key={p.urn} onClick={() => onSelect(p)}>
                    <td className="cmpcol" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && full}
                        onChange={() => onToggleCompare(p.urn)}
                        aria-label={`Compare ${p.name}`}
                        title={!checked && full ? "Compare list is full (max 5)" : "Add to compare"}
                      />
                    </td>
                    <td className="num">{row.distance.toFixed(1)} mi</td>
                    <td className="nm">
                      <span className="tname">{p.name}</span>
                      <span className="tmeta">
                        <span
                          className={`ftag ${
                            p.funding === "Independent" ? "indep" : "state"
                          }`}
                        >
                          {p.funding === "Independent" ? "Indep" : "State"}
                        </span>{" "}
                        {p.local_authority} · {p.postcode}
                      </span>
                    </td>
                    {METRICS.map((m) => {
                      const v = p[resolveKey(m, year)];
                      return (
                        <td key={m.key} className="num">
                          {v == null ? "—" : m.format(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Required postcode entry that sets the list's centre point. Geocodes via
// postcodes.io (full or outward codes), showing inline validation.
function CentreInput({ centre, onCentre }) {
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState(null);
  const busy = useRef(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    const pc = detectPostcode(q);
    if (!pc) {
      setMsg("Enter a valid UK postcode (e.g. N4 3LS or N4).");
      return;
    }
    busy.current = true;
    setMsg("Locating…");
    const place = await geocode(pc);
    busy.current = false;
    if (place) {
      onCentre(place);
      setQ("");
      setMsg(null);
    } else {
      setMsg(`Couldn't find postcode “${pc.label}”.`);
    }
  };

  return (
    <form className="centre" onSubmit={submit}>
      <label className="centrelabel">Centre postcode</label>
      <div className="centrerow">
        <input
          type="search"
          placeholder="e.g. N4 3LS"
          value={q}
          onChange={(e) => { setQ(e.target.value); setMsg(null); }}
          aria-label="Centre postcode"
        />
        <button type="submit">{centre ? "Update" : "Show list"}</button>
      </div>
      {msg && <p className="searchmsg">{msg}</p>}
      {centre && !msg && <p className="centrenow">Centred on {centre.label}</p>}
    </form>
  );
}
