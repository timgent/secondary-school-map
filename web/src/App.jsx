import { useEffect, useMemo, useState } from "react";
import SchoolMap from "./SchoolMap.jsx";
import FilterPanel from "./FilterPanel.jsx";
import SchoolDetail from "./SchoolDetail.jsx";
import { applyFilters } from "./filters.js";
import { encodeState, decodeState } from "./urlState.js";

const initial = decodeState(window.location.search);

export default function App() {
  const [features, setFeatures] = useState(null);
  const [filters, setFilters] = useState(initial.filters);
  const [colorBy, setColorBy] = useState(initial.colorBy);
  const [year, setYear] = useState(initial.year);
  const [view, setView] = useState(initial.view);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/schools.geojson")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((fc) => setFeatures(fc.features))
      .catch((e) => setError(e.message));
  }, []);

  // keep the URL in sync so the current view is shareable
  useEffect(() => {
    const qs = encodeState({ colorBy, year, filters, view });
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [colorBy, year, filters, view]);

  const filtered = useMemo(() => {
    if (!features) return null;
    return { type: "FeatureCollection", features: applyFilters(features, filters, year) };
  }, [features, filters, year]);

  if (error)
    return (
      <div className="loading">
        Could not load schools.geojson ({error}).<br />
        Run <code>npm run copy-data</code> after building the pipeline.
      </div>
    );
  if (!features) return <div className="loading">Loading schools…</div>;

  return (
    <div className="app">
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        colorBy={colorBy}
        setColorBy={setColorBy}
        year={year}
        setYear={setYear}
        count={filtered.features.length}
        total={features.length}
      />
      <div className="mapwrap">
        <SchoolMap
          data={filtered}
          colorBy={colorBy}
          year={year}
          initialView={initial.view}
          onMove={setView}
          onSelect={setSelected}
        />
        {selected && (
          <SchoolDetail school={selected} year={year} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
