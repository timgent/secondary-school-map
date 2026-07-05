import { useEffect, useMemo, useState } from "react";
import SchoolMap from "./SchoolMap.jsx";
import FilterPanel from "./FilterPanel.jsx";
import SchoolDetail from "./SchoolDetail.jsx";
import { defaultFilters, applyFilters } from "./filters.js";
import { LATEST_YEAR } from "./metrics.js";

export default function App() {
  const [features, setFeatures] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [colorBy, setColorBy] = useState("progress8");
  const [year, setYear] = useState(LATEST_YEAR);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/schools.geojson")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((fc) => setFeatures(fc.features))
      .catch((e) => setError(e.message));
  }, []);

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
        <SchoolMap data={filtered} colorBy={colorBy} year={year} onSelect={setSelected} />
        {selected && (
          <SchoolDetail school={selected} year={year} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
