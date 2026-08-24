import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import MediaUploadLayer from "./MediaUploadLayer.jsx";
import LiveMediaHydrator from "./LiveMediaHydrator.jsx";
import PhaseCPostLayer from "./PhaseCPostLayer.jsx";
import PhaseCPaginationLayer from "./PhaseCPaginationLayer.jsx";
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
    <MediaUploadLayer />
    <LiveMediaHydrator />
    <PhaseCPostLayer />
    <PhaseCPaginationLayer />
  </React.StrictMode>
);
