import React from "react";

export default function LoadingSkeleton({ t, type = "card", count = 1 }) {
  const items = Array.from({ length: count });
  return <div aria-busy="true" aria-label="Loading" style={{ display: "grid", gap: 12 }}>
    {items.map((_, i) => <div key={i} style={{ borderRadius: 16, border: `1px solid ${t.border}`, background: t.surface, padding: type === "post" ? 0 : 14, overflow: "hidden" }}>
      {type === "post" && <div style={{ width: "100%", aspectRatio: "4 / 3", background: t.bg2, animation: "cmPulse 1.3s ease-in-out infinite" }} />}
      <div style={{ display: "flex", gap: 10, marginTop: type === "post" ? 0 : 0, alignItems: "center" }}>
        <span style={{ width: 38, height: 38, borderRadius: "50%", background: t.bg2, animation: "cmPulse 1.3s ease-in-out infinite" }} />
        <span style={{ flex: 1, height: 12, borderRadius: 8, background: t.bg2, animation: "cmPulse 1.3s ease-in-out infinite" }} />
      </div>
      <span style={{ display: "block", width: "72%", height: 10, borderRadius: 8, background: t.bg2, marginTop: 12, animation: "cmPulse 1.3s ease-in-out infinite" }} />
    </div>)}
    <style>{`@keyframes cmPulse { 50% { opacity: .45; } }`}</style>
  </div>;
}
