import React from "react";
import { ChevronLeft, MoreHorizontal } from "lucide-react";

export default function ChatHeader({ t, user, onBack, onMore }) {
  return (
    <header className="cm-chat-header" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${t.border}`, background: t.bg2 }}>
      <button onClick={onBack} aria-label="Back" style={{ border: 0, background: "transparent", color: t.text, padding: 8, cursor: "pointer" }}><ChevronLeft size={20} /></button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Chat"}</div>
        {user?.status && <div style={{ fontSize: 11, color: t.textMuted }}>{user.status}</div>}
      </div>
      <button onClick={onMore} aria-label="More options" style={{ border: 0, background: "transparent", color: t.textMuted, padding: 8, cursor: "pointer" }}><MoreHorizontal size={20} /></button>
    </header>
  );
}
