import React from "react";
import { Users } from "lucide-react";

export default function ClubCard({ t, club, onOpen }) {
  return (
    <button onClick={() => onOpen?.(club)} className="cm-club-card" style={{ width: "100%", minHeight: 112, textAlign: "left", padding: 16, borderRadius: 16, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer" }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", background: t.bg2, fontSize: 20, marginBottom: 10 }}>{club?.emoji || "🎓"}</div>
      <div style={{ fontWeight: 800, fontSize: 14 }}>{club?.name || "Campus Club"}</div>
      {club?.memberCount != null && <div style={{ display: "flex", gap: 5, alignItems: "center", color: t.textMuted, fontSize: 11, marginTop: 5 }}><Users size={12} /> {club.memberCount} members</div>}
    </button>
  );
}
