// UK postcode detection + geocoding via the free postcodes.io service. Shared
// by the map's SearchBox ("centre map here") and the List view's required
// centre-point input.

// UK postcode shapes (compact, no space): full incl. inward, or outward only.
const FULL_PC = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\d[A-Za-z]{2}$/;
const OUT_PC = /^[A-Za-z]{1,2}\d[A-Za-z\d]?$/;

export function detectPostcode(raw) {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (FULL_PC.test(compact))
    return { label: `${compact.slice(0, -3)} ${compact.slice(-3)}`, compact, outward: false };
  if (OUT_PC.test(compact)) return { label: compact, compact, outward: true };
  return null;
}

export async function geocode(pc) {
  const base = pc.outward ? "outcodes" : "postcodes";
  const r = await fetch(`https://api.postcodes.io/${base}/${encodeURIComponent(pc.compact)}`);
  if (!r.ok) return null;
  const res = (await r.json())?.result;
  if (!res || res.longitude == null) return null;
  return {
    lng: res.longitude,
    lat: res.latitude,
    label: pc.label,
    compact: pc.compact,
    zoom: pc.outward ? 12 : 15,
  };
}
