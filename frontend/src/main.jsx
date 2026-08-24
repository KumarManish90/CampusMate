import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import MediaUploadLayer from "./MediaUploadLayer.jsx";
import "./responsive.css";
import "./responsive-edge.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <MediaUploadLayer />
  </React.StrictMode>
);
