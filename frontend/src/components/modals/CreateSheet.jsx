import React, { useState } from "react";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Clapperboard, Film, Image as ImageIcon, Type as TypeIcon, Users } from "lucide-react";

export default function CreateSheet({ t, onClose, onPublish, PrimaryButton }) {
  const [mode, setMode] = useState(null);
  const [caption, setCaption] = useState("");
  const options = [
    { key: "photo", label: "Photo Post", icon: ImageIcon },
    { key: "reel", label: "Reel", icon: Clapperboard },
    { key: "text", label: "Text Post", icon: TypeIcon },
    { key: "event", label: "Event Post", icon: Calendar },
    { key: "club", label: "Club Post", icon: Users },
  ];
  const publish = () => { if (!caption.trim()) return; onPublish?.({ type: mode === "reel" ? "text" : mode, caption: caption.trim() }); setCaption(""); setMode(null); onClose?.(); };
  return (
    <div className="cm-sheet-overlay" style={{ position: "fixed", inset: 0, zIndex: 95, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,14,.6)", backdropFilter: "blur(4px)" }} />
      <div className="cm-sheet-panel cm-create-sheet" onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 460, background: t.bg2, borderRadius: "22px 22px 0 0", border: `1px solid ${t.border}`, borderBottom: "none", padding: 20, paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: t.border, margin: "0 auto 16px" }} />
        {!mode ? <><h3 style={{ fontSize: 17, marginBottom: 14 }}>Create</h3><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{options.map((o) => <button key={o.key} onClick={() => setMode(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 14, border: `1px solid ${t.border}`, background: "transparent", color: t.text, textAlign: "left", cursor: "pointer" }}><o.icon size={18} /><span style={{ fontWeight: 700 }}>{o.label}</span><ChevronRight size={15} style={{ marginLeft: "auto" }} /></button>)}</div></> : <><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><button onClick={() => setMode(null)} style={{ background: "none", border: 0, color: t.text, cursor: "pointer" }}><ChevronLeft size={18} /></button><h3 style={{ margin: 0, fontSize: 16 }}>New {options.find((o) => o.key === mode)?.label}</h3></div>{mode !== "text" && <div style={{ height: 150, borderRadius: 14, border: `1.5px dashed ${t.border}`, display: "grid", placeItems: "center", marginBottom: 14, color: t.textFaint }}>{mode === "reel" ? <Film size={22} /> : <ImageIcon size={22} />}</div>}<textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." rows={3} style={{ width: "100%", resize: "none", boxSizing: "border-box", borderRadius: 12, padding: 12, background: "transparent", color: t.text, border: `1.5px solid ${t.border}` }} /><PrimaryButton onClick={publish} style={{ width: "100%", marginTop: 14, justifyContent: "center" }} icon={ArrowRight}>Post to CampusMate</PrimaryButton></>}
      </div>
    </div>
  );
}
