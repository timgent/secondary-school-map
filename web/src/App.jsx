import { useEffect, useMemo, useState } from "react";
import SchoolMap from "./SchoolMap.jsx";
import SchoolList from "./SchoolList.jsx";
import CompareView from "./CompareView.jsx";
import FilterPanel from "./FilterPanel.jsx";
import SchoolDetail from "./SchoolDetail.jsx";
import { applyFilters } from "./filters.js";
import { encodeState, decodeState } from "./urlState.js";
import { nearest } from "./distance.js";
import { detectPostcode, geocode } from "./geocode.js";

const initial = decodeState(window.location.search);
export const MAX_COMPARE = 5;

const isMobile = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

export default function App() {
  const [features, setFeatures] = useState(null);
  const [mode, setMode] = useState(initial.mode);
  // on phones the panel is a collapsible overlay; start closed there so the
  // map/list gets the screen. On desktop it's always shown (CSS ignores this).
  const [panelOpen, setPanelOpen] = useState(() => !isMobile());
  const [comparing, setComparing] = useState(initial.comparing);
  const [compareUrns, setCompareUrns] = useState(initial.compareUrns);
  const [filters, setFilters] = useState(initial.filters);
  const [colorBy, setColorBy] = useState(initial.colorBy);
  const [year, setYear] = useState(initial.year);
  const [view, setView] = useState(initial.view);
  const [focus, setFocus] = useState(null);
  const [place, setPlace] = useState(null);
  const [listCentre, setListCentre] = useState(null);
  const [sort, setSort] = useState(initial.sort);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  // on phones, collapse the panel after an action so the result is visible
  const closeOnMobile = () => { if (isMobile()) setPanelOpen(false); };

  // pick a school from search: open its card and fly the map to it
  const pickSchool = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    setSelected(feature.properties);
    setFocus((prev) => ({ lng, lat, zoom: 13, n: (prev?.n ?? 0) + 1 }));
    closeOnMobile();
  };

  // go to an arbitrary geocoded postcode: drop a marker and fly there
  const goToPlace = ({ lng, lat, zoom, label }) => {
    setPlace({ lng, lat, label });
    setFocus((prev) => ({ lng, lat, zoom, n: (prev?.n ?? 0) + 1 }));
    closeOnMobile();
  };

  // switching the Map/List toggle also leaves the compare overlay
  const switchMode = (m) => { setMode(m); setComparing(false); closeOnMobile(); };

  // opening the compare view collapses the panel on phones
  const setComparingMobile = (v) => { setComparing(v); if (v) closeOnMobile(); };

  // add/remove a school from the compare set (URN-keyed, capped at MAX_COMPARE).
  // Carried across map & list views since it lives here in App state.
  const toggleCompare = (urn) => {
    const id = String(urn);
    setCompareUrns((prev) =>
      prev.includes(id)
        ? prev.filter((u) => u !== id)
        : prev.length >= MAX_COMPARE
        ? prev
        : [...prev, id]
    );
  };

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}schools.geojson`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((fc) => setFeatures(fc.features))
      .catch((e) => setError(e.message));
  }, []);

  // restore the list centre from a shared ?pc= postcode by geocoding it once
  useEffect(() => {
    if (!initial.centrePc) return;
    const pc = detectPostcode(initial.centrePc);
    if (pc) geocode(pc).then((place) => place && setListCentre(place));
  }, []);

  // keep the URL in sync so the current view is shareable
  useEffect(() => {
    const qs = encodeState({
      mode, comparing, compareUrns, colorBy, year, filters, view, listCentre, sort,
    });
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [mode, comparing, compareUrns, colorBy, year, filters, view, listCentre, sort]);

  // urn -> feature, for resolving the compare selection and dropping stale urns
  const bySchool = useMemo(() => {
    const m = new Map();
    if (features) for (const f of features) m.set(String(f.properties.urn), f);
    return m;
  }, [features]);

  const compareFeatures = useMemo(
    () => compareUrns.map((u) => bySchool.get(u)).filter(Boolean),
    [compareUrns, bySchool]
  );

  const filtered = useMemo(() => {
    if (!features) return null;
    return applyFilters(features, filters, year);
  }, [features, filters, year]);

  // closest 50 filtered schools to the list centre (List view only)
  const listRows = useMemo(() => {
    if (mode !== "list" || !filtered || !listCentre) return null;
    return nearest(filtered, listCentre, 50);
  }, [mode, filtered, listCentre]);

  if (error)
    return (
      <div className="loading">
        Could not load schools.geojson ({error}).<br />
        Run <code>npm run copy-data</code> after building the pipeline.
      </div>
    );
  if (!features) return <div className="loading">Loading schools…</div>;

  const filteredFC = { type: "FeatureCollection", features: filtered };

  return (
    <div className={`app ${panelOpen ? "panel-open" : ""}`}>
      <button
        className="panel-toggle"
        onClick={() => setPanelOpen((o) => !o)}
        aria-label={panelOpen ? "Hide filters" : "Show filters"}
      >
        ☰ Filters
      </button>
      <FilterPanel
        onClosePanel={() => setPanelOpen(false)}
        mode={mode}
        setMode={switchMode}
        comparing={comparing}
        setComparing={setComparingMobile}
        compareFeatures={compareFeatures}
        onToggleCompare={toggleCompare}
        onClearCompare={() => setCompareUrns([])}
        filters={filters}
        setFilters={setFilters}
        colorBy={colorBy}
        setColorBy={setColorBy}
        year={year}
        setYear={setYear}
        count={filtered.length}
        total={features.length}
        features={features}
        onPick={pickSchool}
        onGoToPlace={goToPlace}
      />
      {panelOpen && (
        <div className="panel-backdrop" onClick={() => setPanelOpen(false)} />
      )}
      <div className="mapwrap">
        {comparing ? (
          <CompareView
            schools={compareFeatures.map((f) => ({
              ...f.properties,
              __lng: f.geometry?.coordinates?.[0],
              __lat: f.geometry?.coordinates?.[1],
            }))}
            year={year}
            centre={listCentre}
            onToggleCompare={toggleCompare}
            onClose={() => setComparing(false)}
          />
        ) : mode === "list" ? (
          <SchoolList
            rows={listRows}
            centre={listCentre}
            onCentre={setListCentre}
            year={year}
            sort={sort}
            setSort={setSort}
            onSelect={setSelected}
            total={filtered.length}
            compareUrns={compareUrns}
            onToggleCompare={toggleCompare}
          />
        ) : (
          <SchoolMap
            data={filteredFC}
            colorBy={colorBy}
            year={year}
            initialView={initial.view}
            focus={focus}
            place={place}
            onMove={setView}
            onSelect={setSelected}
          />
        )}
        {selected && !comparing && (
          <SchoolDetail
            school={selected}
            year={year}
            onClose={() => setSelected(null)}
            inCompare={compareUrns.includes(String(selected.urn))}
            compareFull={compareUrns.length >= MAX_COMPARE}
            onToggleCompare={toggleCompare}
          />
        )}
      </div>
    </div>
  );
}
