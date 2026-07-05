import { useMemo, useRef, useState } from "react";
import { detectPostcode, geocode } from "./geocode.js";

// Client-side search over the loaded schools by name, postcode, or area
// (local authority). Searches ALL schools, ignoring the active filters, so any
// school is findable. Picking a result flies the map there and opens its card.
// A typed UK postcode (full or outward, e.g. "N4 3LS" or "N4") also offers a
// "centre map here" option, geocoded via the free postcodes.io service.
const MAX = 8;

function score(p, q) {
  const name = p.name.toLowerCase();
  const pc = (p.postcode || "").toLowerCase().replace(/\s+/g, "");
  const la = (p.local_authority || "").toLowerCase();
  const pcq = q.replace(/\s+/g, "");
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;
  if (pc.startsWith(pcq)) return 2;
  if (la.startsWith(q)) return 3;
  if (la.includes(q)) return 4;
  return 5;
}

function searchSchools(features, raw) {
  const q = raw.trim().toLowerCase();
  if (q.length < 2) return [];
  const pcq = q.replace(/\s+/g, "");
  const hits = [];
  for (const f of features) {
    const p = f.properties;
    const name = p.name.toLowerCase();
    const pc = (p.postcode || "").toLowerCase().replace(/\s+/g, "");
    const la = (p.local_authority || "").toLowerCase();
    if (name.includes(q) || pc.includes(pcq) || la.includes(q)) hits.push([score(p, q), f]);
  }
  hits.sort((a, b) => a[0] - b[0] || a[1].properties.name.localeCompare(b[1].properties.name));
  return hits.slice(0, MAX).map((h) => h[1]);
}

export default function SearchBox({ features, onPick, onGoToPlace }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState(null);
  const blurTimer = useRef(null);

  // combined result list: an optional "go to postcode" row, then schools
  const items = useMemo(() => {
    const list = [];
    const pc = onGoToPlace ? detectPostcode(q) : null;
    if (pc) list.push({ kind: "place", pc });
    for (const f of searchSchools(features, q)) list.push({ kind: "school", feature: f });
    return list;
  }, [features, q, onGoToPlace]);

  const choose = async (item) => {
    if (!item) return;
    if (item.kind === "school") {
      onPick(item.feature);
      setQ(item.feature.properties.name);
      setOpen(false);
      return;
    }
    // postcode: geocode then fly there
    setMsg("Locating…");
    const place = await geocode(item.pc);
    if (place) {
      onGoToPlace(place);
      setQ(place.label);
      setOpen(false);
      setMsg(null);
    } else {
      setMsg(`Couldn't find postcode “${item.pc.label}”.`);
    }
  };

  const onKeyDown = (e) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(items[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const show = open && items.length > 0;

  return (
    <div className="search">
      <input
        type="search"
        placeholder="Search name, postcode or area…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); setMsg(null); }}
        onFocus={() => setOpen(true)}
        onBlur={() => (blurTimer.current = setTimeout(() => setOpen(false), 150))}
        onKeyDown={onKeyDown}
        aria-label="Search schools or postcode"
      />
      {msg && <p className="searchmsg">{msg}</p>}
      {show && (
        <ul className="results" onMouseDown={() => clearTimeout(blurTimer.current)}>
          {items.map((item, i) =>
            item.kind === "place" ? (
              <li
                key="place"
                className={`place ${i === active ? "active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
              >
                <span className="rname">📍 Centre map on {item.pc.label}</span>
                <span className="rmeta">Postcode location</span>
              </li>
            ) : (
              <li
                key={item.feature.properties.urn}
                className={i === active ? "active" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(item)}
              >
                <span className="rname">{item.feature.properties.name}</span>
                <span className="rmeta">
                  {item.feature.properties.local_authority} · {item.feature.properties.postcode}
                </span>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
