import React from "react";
import { Image as ImageIcon, Send } from "lucide-react";

export default function ChatComposer({ t, value, onChange, onSend, onMedia }) {
  return (
    <form className="cm-chat-composer" onSubmit={(e) => { e.preventDefault(); onSend?.(); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, borderTop: `1px solid ${t.border}`, background: t.bg2 }}>
      <button type="button" onClick={onMedia} aria-label="Attach media" style={{ width: 42, height: 42, border: 0, borderRadius: 12, background: t.surface, color: t.textMuted, cursor: "pointer" }}><ImageIcon size={18} /></button>
      <input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder="Write a message..." aria-label="Message" style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: "0 12px", outline: "none" }} />
      <button type="submit" aria-label="Send message" style={{ width: 42, height: 42, border: 0, borderRadius: 12, background: "#6D5DF6", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center" }}><Send size={17} /></button>
    </form>
  );
}
