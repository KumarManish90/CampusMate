import React from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";

export default function EventCard({ t, event, onOpen }) {
  return (
    <button onClick={() => onOpen?.(event)} className="cm-event-card" style={{ width: "100%", textAlign: "left", padding: 16, borderRadius: 16, border: `1px solid ${t.border}`, background: t.surface, color: t.text, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: t.textMuted, fontSize: 11, fontWeight: 700 }}><CalendarDays size={14} /> {event?.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}</div>
      <h3 style={{ margin: "8px 0 6px", fontSize: 15 }}>{event?.title || "Campus Event"}</h3>
      {event?.location && <div style={{ display: "flex", gap: 6, alignItems: "center", color: t.textMuted, fontSize: 12 }}><MapPin size={13} /> {event.location}</div>}
      {event?.attendingCount != null && <div style={{ display: "flex", gap: 6, alignItems: "center", color: t.textMuted, fontSize: 12, marginTop: 6 }}><Users size={13} /> {event.attendingCount} attending</div>}
    </button>
  );
}
