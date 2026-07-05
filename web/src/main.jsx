import React from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";
import App from "./App.jsx";

// NB: SchoolMap resets its refs on unmount so the map survives StrictMode's
// dev double-mount (mount → cleanup → mount) rather than being left removed.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
