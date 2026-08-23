import React from "react";

/**
 * Shared application shell. Navigation components are injected so this file
 * stays independent from the app's existing state, theme and data layer.
 */
export default function Shell({ t, children, sidebar, bottomNav }) {
  return (
    <div className="cm-app-shell" style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", width: "100%" }}>
      {sidebar}
      <main className="cm-app-content" style={{ flex: 1, minWidth: 0, paddingBottom: 76, width: "100%" }}>
        {children}
      </main>
      {bottomNav}
    </div>
  );
}
