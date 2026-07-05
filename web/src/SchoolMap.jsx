import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { colorExpression } from "./metrics.js";

// Free CARTO Positron basemap (no API key) — light, ideal for data overlays.
const BASEMAP_STYLE = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, © <a href="https://carto.com">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

const EMPTY = { type: "FeatureCollection", features: [] };

export default function SchoolMap({ data, colorBy, year, initialView, focus, place, onMove, onSelect }) {
  const container = useRef(null);
  const map = useRef(null);
  const ready = useRef(false);
  const marker = useRef(null);
  // keep the latest onMove without re-running the init effect
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // init once
  useEffect(() => {
    if (map.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: [initialView.lng, initialView.lat],
      zoom: initialView.zoom,
      maxZoom: 15,
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // sync pan/zoom back up so the URL stays shareable
    m.on("moveend", () => {
      const c = m.getCenter();
      onMoveRef.current?.({ lng: c.lng, lat: c.lat, zoom: m.getZoom() });
    });

    m.on("load", () => {
      m.addSource("schools", { type: "geojson", data: EMPTY });
      m.addLayer({
        id: "schools",
        type: "circle",
        source: "schools",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3, 10, 6, 14, 10],
          "circle-color": colorExpression(colorBy, year),
          "circle-stroke-width": 0.6,
          "circle-stroke-color": "#33333366",
          "circle-opacity": 0.9,
        },
      });
      ready.current = true;
      if (data) m.getSource("schools").setData(data);

      m.on("click", "schools", (e) => onSelect?.(e.features[0].properties));
      m.on("mouseenter", "schools", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "schools", () => (m.getCanvas().style.cursor = ""));
    });
    // Reset refs on unmount so React 18 StrictMode's dev double-mount
    // (mount → cleanup → mount) recreates the map instead of leaving it removed.
    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
    };
  }, []); // eslint-disable-line

  // update data
  useEffect(() => {
    if (ready.current && data) map.current.getSource("schools").setData(data);
  }, [data]);

  // update colour dimension (and active year for multi-year metrics)
  useEffect(() => {
    if (ready.current)
      map.current.setPaintProperty("schools", "circle-color", colorExpression(colorBy, year));
  }, [colorBy, year]);

  // fly to a school chosen from search (n bumps so re-picking the same one works)
  useEffect(() => {
    if (focus && map.current)
      map.current.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, speed: 1.4 });
  }, [focus?.n]); // eslint-disable-line

  // drop / move a marker for a geocoded postcode ("your home")
  useEffect(() => {
    if (!place || !map.current) return;
    if (!marker.current) marker.current = new maplibregl.Marker({ color: "#1a5fb4" });
    marker.current
      .setLngLat([place.lng, place.lat])
      .setPopup(new maplibregl.Popup({ offset: 24, closeButton: false }).setText(place.label))
      .addTo(map.current);
  }, [place]);

  return <div ref={container} className="map" />;
}
