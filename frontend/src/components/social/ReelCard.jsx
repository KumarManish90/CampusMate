import React from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

export default function ReelCard({ t, reel, onLike, onComment, onShare }) {
  const author = reel?.author || reel?.user || {};
  return (
    <article className="cm-reel-card" style={{ position: "relative", width: "100%", maxWidth: 520, aspectRatio: "9 / 16", overflow: "hidden", borderRadius: 18, background: "#111" }}>
      {reel?.video && <video src={reel.video} poster={reel.thumbnail} controls playsInline loop style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      <div style={{ position: "absolute", right: 10, bottom: 80, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => onLike?.(reel)} aria-label="Like" style={{ width: 42, height: 42, border: 0, borderRadius: "50%", background: "rgba(0,0,0,.48)", color: reel?.liked ? "#FB4570" : "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Heart size={20} fill={reel?.liked ? "currentColor" : "none"} /></button>
        <button onClick={() => onComment?.(reel)} aria-label="Comments" style={{ width: 42, height: 42, border: 0, borderRadius: "50%", background: "rgba(0,0,0,.48)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><MessageCircle size={20} /></button>
        <button onClick={() => onShare?.(reel)} aria-label="Share" style={{ width: 42, height: 42, border: 0, borderRadius: "50%", background: "rgba(0,0,0,.48)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}><Share2 size={20} /></button>
      </div>
      <div style={{ position: "absolute", left: 14, right: 64, bottom: 14, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,.7)" }}><div style={{ fontWeight: 800, fontSize: 13 }}>@{author.username || author.name || "campusmate"}</div>{reel?.caption && <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.4 }}>{reel.caption}</div>}</div>
    </article>
  );
}
