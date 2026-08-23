import React, { useState } from "react";
import { X, Send } from "lucide-react";

export default function CommentsSheet({ t, post, profile, onClose, onAddComment, Avatar, byId }) {
  const [draft, setDraft] = useState("");
  if (!post) return null;
  const submit = () => {
    if (!draft.trim()) return;
    onAddComment?.(post.id, draft.trim());
    setDraft("");
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,14,.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "78vh", background: t.bg2, borderRadius: "22px 22px 0 0", border: `1px solid ${t.border}`, borderBottom: "none", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, fontSize: 15, color: t.text }}>Comments · {post.commentsCount}</span><button onClick={onClose} aria-label="Close" style={{ background: "none", border: 0, color: t.textFaint, cursor: "pointer" }}><X size={18} /></button></div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {post.comments?.length === 0 && <div style={{ textAlign: "center", color: t.textFaint, fontSize: 13, padding: 30 }}>No comments yet. Start the conversation.</div>}
          {(post.comments || []).map((c) => { const a = byId(c.authorId); return <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 16 }}><Avatar name={a.name} color={t.primary} size={34} /><div><div style={{ fontSize: 12.5 }}><strong>{a.name}</strong> <span style={{ color: t.textFaint }}>· {a.college}</span></div><div style={{ fontSize: 13, marginTop: 2 }}>{c.text}</div><div style={{ fontSize: 11, color: t.textFaint, marginTop: 4 }}>{c.time}</div></div></div>; })}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${t.border}`, display: "flex", gap: 10 }}><Avatar name={profile?.name || "You"} color={t.primary} size={32} /><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Add a comment..." style={{ flex: 1, minWidth: 0, borderRadius: 999, border: `1.5px solid ${t.border}`, padding: "9px 14px", background: "transparent", color: t.text, fontSize: 13 }} /><button onClick={submit} aria-label="Send comment" style={{ background: "none", border: 0, color: t.primary, cursor: "pointer" }}><Send size={18} /></button></div>
      </div>
    </div>
  );
}
