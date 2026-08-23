import React from "react";

export default function StoryStrip({ t, stories = [], onAdd, onOpen }) {
  return (
    <section className="cm-story-strip" aria-label="Stories" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "10px 4px 14px", scrollbarWidth: "none" }}>
      <button onClick={onAdd} style={{ flex: "0 0 68px", border: 0, background: "transparent", color: t.text, cursor: "pointer", padding: 0 }}>
        <div style={{ width: 58, height: 58, borderRadius: "50%", margin: "0 auto 5px", display: "grid", placeItems: "center", background: t.surface, border: `2px dashed ${t.border}`, fontSize: 24 }}>+</div>
        <span style={{ fontSize: 10, fontWeight: 700 }}>Your story</span>
      </button>
      {stories.map((story) => {
        const user = story.author || story.user || {};
        return <button key={story._id || story.id} onClick={() => onOpen?.(story)} style={{ flex: "0 0 68px", border: 0, background: "transparent", color: t.text, cursor: "pointer", padding: 0 }}>
          <div style={{ width: 62, height: 62, padding: 2, borderRadius: "50%", margin: "0 auto 5px", background: story.seen ? t.border : "linear-gradient(135deg,#6D5DF6,#FB4570)" }}><img src={user.avatar || user.photo || "/placeholder-avatar.png"} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${t.bg}` }} /></div>
          <span style={{ display: "block", fontSize: 10, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || "User"}</span>
        </button>;
      })}
    </section>
  );
}
