import React, { useRef } from "react";
import { CheckCircle2 } from "lucide-react";

export default function SwipeCard({ t, student, onDecision, isTop, dragState, setDragState, Badge, collegeColor, tokens }) {
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleDown = (x, y) => {
    if (!isTop) return;
    dragging.current = true;
    startPos.current = { x, y };
  };
  const handleMove = (x, y) => {
    if (!dragging.current || !isTop) return;
    setDragState({ x: x - startPos.current.x, y: y - startPos.current.y });
  };
  const handleUp = () => {
    if (!isTop) return;
    dragging.current = false;
    const { x, y } = dragState;
    if (x > 110) onDecision("like");
    else if (x < -110) onDecision("pass");
    else if (y < -110) onDecision("super");
    else setDragState({ x: 0, y: 0 });
  };

  const rotate = isTop ? dragState.x / 18 : 0;
  const tx = isTop ? dragState.x : 0;
  const ty = isTop ? dragState.y * 0.4 : 0;
  const likeOpacity = isTop ? Math.min(1, Math.max(0, dragState.x / 100)) : 0;
  const passOpacity = isTop ? Math.min(1, Math.max(0, -dragState.x / 100)) : 0;
  const superOpacity = isTop ? Math.min(1, Math.max(0, -dragState.y / 100)) : 0;

  return (
    <article
      className="cm-swipe-card"
      onMouseDown={(e) => handleDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleUp}
      onMouseLeave={() => dragging.current && handleUp()}
      onTouchStart={(e) => handleDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleUp}
      style={{ position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", cursor: isTop ? "grab" : "default", transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`, transition: dragging.current ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)", border: `1px solid ${t.border}`, userSelect: "none", touchAction: "none", background: `linear-gradient(160deg, ${collegeColor(student.college)}33, ${t.bg2})` }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 150, height: 150, borderRadius: "50%", background: `linear-gradient(135deg, ${collegeColor(student.college)}, ${tokens.primary2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 700, color: "#fff" }}>{student.name?.[0] || "?"}</div>
      </div>
      <div style={{ position: "absolute", top: 18, left: 18, opacity: passOpacity, border: `3px solid ${tokens.like}`, color: tokens.like, fontWeight: 800, fontSize: 22, padding: "4px 14px", borderRadius: 10 }}>PASS</div>
      <div style={{ position: "absolute", top: 18, right: 18, opacity: likeOpacity, border: `3px solid ${tokens.super}`, color: tokens.super, fontWeight: 800, fontSize: 22, padding: "4px 14px", borderRadius: 10 }}>LIKE</div>
      <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", opacity: superOpacity, border: `3px solid ${tokens.amber}`, color: tokens.amber, fontWeight: 800, fontSize: 20, padding: "4px 14px", borderRadius: 10 }}>SUPER ⭐</div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 20px 20px", background: "linear-gradient(0deg, rgba(0,0,0,.78), transparent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "#fff", fontWeight: 700, fontSize: 21 }}>{student.name}, {student.age}</span><CheckCircle2 size={16} color={tokens.super} /></div>
        <div style={{ color: "rgba(255,255,255,.85)", fontSize: 13, margin: "4px 0 6px" }}>{student.branch} • {student.year}</div>
        {Badge && <Badge color={collegeColor(student.college)}>{student.college}</Badge>}
        <p style={{ color: "rgba(255,255,255,.9)", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{student.bio}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{(student.interests || []).map((interest) => <span key={interest} style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,.18)", padding: "3px 9px", borderRadius: 999 }}>{interest}</span>)}</div>
      </div>
    </article>
  );
}
