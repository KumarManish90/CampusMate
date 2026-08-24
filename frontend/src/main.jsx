import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import StabilizationLayers from "./StabilizationLayers.jsx";
import { installThemeBackgroundGuard } from "./themeBackgroundGuard.js";
import "./responsive.css";
import "./responsive-edge.css";

function ThemeBackgroundGuard() {
  useEffect(() => installThemeBackgroundGuard(), []);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeBackgroundGuard />
    <App />
    <StabilizationLayers />
  </React.StrictMode>
);
