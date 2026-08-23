import React from "react";
import { Heart, MessageCircle, Users, Calendar, ChevronRight, GraduationCap } from "lucide-react";

/**
 * Home screen container. The existing app can pass its card/render helpers and
 * handlers without moving business state into this presentation component.
 */
export default function Home({
  t,
  profile,
  matches = [],
  following = [],
  students = [],
  events = [],
  clubs = [],
  onToggleFollow,
  onGoDiscover,
  onOpenStory,
  onBell,
  setTab,
  StoriesRow,
  EventCard,
  GlassCard,
  Avatar,
  Badge,
  AnimatedNumber,
  collegeColor,
  tokens,
}) {
  const stats = [
    { icon: Heart, label: "Matches", value: matches.length, color: tokens.like },
    { icon: MessageCircle, label: "Messages", value: matches.length ? matches.length + 3 : 0, color: tokens.super },
    { icon: Users, label: "Connections", value: following.length, color: tokens.primary },
    { icon: Calendar, label: "Events", value: events.length, color: tokens.amber },
  ];

  return (
    <div className="cm-home">
      <div className="cm-home-header" style={{ padding: "22px 24px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="cm-display" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Good morning, {profile?.name?.split(" ")[0] || "there"} 👋</h1>
          <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0" }}>Your campus. Your community.</p>
        </div>
        <button aria-label="Notifications" onClick={onBell} className="cm-icon-button" style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
          <span aria-hidden="true">🔔</span>
        </button>
      </div>

      <div className="cm-home-content" style={{ padding: "6px 24px 28px" }}>
        {StoriesRow && <StoriesRow t={t} profile={profile} onOpen={onOpenStory} />}

        <div className="cm-announcement" style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", margin: "16px 0", borderRadius: 12, background: `${tokens.primary}14`, border: `1px solid ${tokens.primary}33` }}>
          <GraduationCap size={15} color={tokens.primary} />
          <span style={{ fontSize: 12, color: t.textMuted }}>CampusMate works for every college — find your campus and connect.</span>
        </div>

        <div className="cm-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, margin: "20px 0" }}>
          {stats.map((s, i) => (
            <GlassCard key={i} t={t} style={{ padding: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><s.icon size={14} color={s.color} /></div>
              <AnimatedNumber value={s.value} t={t} />
              <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard t={t} onClick={onGoDiscover} style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 22, border: `1px solid ${tokens.primary}44` }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 11, background: `${tokens.like}22`, display: "flex", alignItems: "center", justifyContent: "center" }}><Heart size={18} color={tokens.like} /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13.5, color: t.text }}>Meet new students</div><div style={{ fontSize: 11.5, color: t.textMuted }}>Find friends, project partners & teammates across all colleges</div></div>
          <ChevronRight size={16} color={t.textFaint} />
        </GlassCard>

        <Section title="Recommended Students" onSeeAll={() => setTab("explore")} t={t} />
        <div className="cm-horizontal-row" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginTop: 10 }}>
          {students.slice(0, 6).map((s) => (
            <GlassCard key={s.id} t={t} style={{ padding: 14, minWidth: 150, flexShrink: 0, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><Avatar name={s.name} color={collegeColor(s.college)} size={48} /></div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: t.text, marginTop: 8 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>{s.college}</div>
              <button onClick={() => onToggleFollow(s.id)} style={{ marginTop: 8, width: "100%", minHeight: 42, padding: "6px 0", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${following.includes(s.id) ? t.border : tokens.primary}`, background: following.includes(s.id) ? "transparent" : `${tokens.primary}1f`, color: following.includes(s.id) ? t.textFaint : tokens.primary }}>{following.includes(s.id) ? "Following" : "Follow"}</button>
            </GlassCard>
          ))}
        </div>

        <Section title="Upcoming Events" onSeeAll={() => setTab("explore")} t={t} />
        <div className="cm-horizontal-row" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginTop: 10 }}>{events.slice(0, 4).map((e) => <EventCard key={e.id} t={t} e={e} compact />)}</div>

        <Section title="Campus Communities" onSeeAll={() => setTab("explore")} t={t} />
        <div className="cm-horizontal-row" style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20, marginTop: 10 }}>{clubs.slice(0, 4).map((c) => <GlassCard key={c.id} t={t} style={{ padding: 14, minWidth: 170, flexShrink: 0 }}><div style={{ fontWeight: 700, fontSize: 12.5, color: t.text }}>{c.name}</div><Badge color={collegeColor(c.college)} style={{ marginTop: 6 }}>{c.college}</Badge></GlassCard>)}</div>
      </div>
    </div>
  );
}

function Section({ title, onSeeAll, t }) {
  return <div className="cm-section-heading" style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 className="cm-display" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2><button onClick={onSeeAll} style={{ minHeight: 44, background: "none", border: "none", color: "#6D5DF6", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>See all</button></div>;
}
