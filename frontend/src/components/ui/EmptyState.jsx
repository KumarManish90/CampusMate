import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({ t, title = "Nothing here yet", description, actionLabel, onAction, icon: Icon = Inbox }) {
  return <div style={{ minHeight: 220, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
    <div style={{ maxWidth: 340 }}>
      <div style={{ width: 54, height: 54, margin: "0 auto 12px", borderRadius: 16, display: "grid", placeItems: "center", background: t.surface, border: `1px solid ${t.border}`, color: t.textMuted }}><Icon size={23} /></div>
      <h3 style={{ margin: 0, color: t.text, fontSize: 16 }}>{title}</h3>
      {description && <p style={{ margin: "7px 0 14px", color: t.textMuted, fontSize: 12.5, lineHeight: 1.5 }}>{description}</p>}
      {actionLabel && <button onClick={onAction} style={{ minHeight: 42, padding: "0 16px", border: 0, borderRadius: 12, background: "#6D5DF6", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{actionLabel}</button>}
    </div>
  </div>;
}
