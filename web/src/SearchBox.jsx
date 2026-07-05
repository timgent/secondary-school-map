import { useMemo, useRef, useState } from "react";

// Client-side search over the loaded schools by name, postcode, or area
// (local authority). Searches ALL schools, ignoring the active filters, so any
// school is findable. Picking a result flies the map there and opens its card.
const MAX = 8;

function score(p, q) {
  const name = p.name.toLowerCase();
  const pc = (p.postcode || "").toLowerCase();
  const la = (p.local_authority || "").toLowerCase();
  const pcq = q.replace(/\s+/g, "");
  if (name.startsWith(q)) return 0;
  if (name.includes(q)) return 1;
  if (pc.replace(/\s+/g, "").startsWith(pcq)) return 2;
  if (la.startsWith(q)) return 3;
  if (la.includes(q)) return 4;
  return 5;
}

function search(features, raw) {
  const q = raw.trim().toLowerCase();
  if (q.length < 2) return [];
  const pcq = q.replace(/\s+/g, "");
  const hits = [];
  for (const f of features) {
    const p = f.properties;
    const name = p.name.toLowerCase();
    const pc = (p.postcode || "").toLowerCase().replace(/\s+/g, "");
    const la = (p.local_authority || "").toLowerCase();
    if (name.includes(q) || pc.includes(pcq) || la.includes(q))
      hits.push([score(p, q), f]);
  }
  hits.sort((a, b) => a[0] - b[0] || a[1].properties.name.localeCompare(b[1].properties.name));
  return hits.slice(0, MAX).map((h) => h[1]);
}

export default function SearchBox({ features, onPick }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef(null);

  const results = useMemo(() => search(features, q), [features, q]);

  const choose = (f) => {
    if (!f) return;
    onPick(f);
    setQ(f.properties.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[active]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const show = open && results.length > 0;

  return (
    <div className="search">
      <input
        type="search"
        placeholder="Search name, postcode or area…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => (blurTimer.current = setTimeout(() => setOpen(false), 120))}
        onKeyDown={onKeyDown}
        aria-label="Search schools"
      />
      {show && (
        <ul className="results" onMouseDown={() => clearTimeout(blurTimer.current)}>
          {results.map((f, i) => {
            const p = f.properties;
            return (
              <li
                key={p.urn}
                className={i === active ? "active" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(f)}
              >
                <span className="rname">{p.name}</span>
                <span className="rmeta">{p.local_authority} · {p.postcode}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
