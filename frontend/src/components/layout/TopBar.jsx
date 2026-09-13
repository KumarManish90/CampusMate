import React from "react";
import { Bell } from "lucide-react";

export default function TopBar({ t, title, subtitle, onBell }) {
  return (
    <header className="cm-topbar" style={{ padding: "22px 24px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 className="cm-display" style={{ fontSize: 22, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>}
      </div>
      <button aria-label="Notifications" onClick={onBell} style={{ width: 44, height: 44, minWidth: 44, flexShrink: 0, borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
        <Bell size={18} color={t.text} />
        <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: "#FB4570", border: `2px solid ${t.bg}` }} />
      </button>
    </header>
  );
}
