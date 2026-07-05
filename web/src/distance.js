// Great-circle distance and the "closest N schools" helper used by the List view.

const R_MILES = 3958.8; // Earth radius in miles
const toRad = (deg) => (deg * Math.PI) / 180;

// Haversine distance in miles between two [lng, lat] points.
export function haversineMiles(lng1, lat1, lng2, lat2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R_MILES * 2 * Math.asin(Math.sqrt(a));
}

// Given already-filtered features and a centre { lng, lat }, return the closest
// `limit` schools, each annotated with a `distance` (miles) property. Features
// without coordinates are skipped.
export function nearest(features, centre, limit = 50) {
  const withDist = [];
  for (const f of features) {
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    const distance = haversineMiles(centre.lng, centre.lat, c[0], c[1]);
    withDist.push({ ...f, distance });
  }
  withDist.sort((a, b) => a.distance - b.distance);
  return withDist.slice(0, limit);
}
