import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart, X, Star, MessageCircle, User, Home, Compass, Users, Calendar,
  Bell, Sun, Moon, MapPin, CheckCircle2, Sparkles, Send, ChevronRight,
  ChevronLeft, Search, Filter, TrendingUp, Award, Zap, GraduationCap,
  BookOpen, Briefcase, PartyPopper, Camera, ArrowRight, Check,
  Plus, Bookmark, Repeat2, MoreHorizontal, Volume2, VolumeX, Play,
  Hash, Image as ImageIcon, Type as TypeIcon, Film, UserPlus, UserCheck,
  ChevronUp, ChevronDown, Clapperboard, Loader2, WifiOff
} from "lucide-react";
import * as cmApi from "./api/client";
import { NativeMessages, NativeProfile, NativeReels, NativeStories } from "./NativeFeatures.jsx";

/* ============================================================
   DESIGN TOKENS
   Display: Space Grotesk (geometric, technical -> engineering campus)
   Body: Inter
   Signature motif: the "Tri-Campus Constellation" — three glowing
   nodes (GGITS / GGCT / GGCE) orbiting a shared center, echoed in
   the logo mark, loaders, and the landing hero.
   ============================================================ */

const TOKENS = {
  dark: {
    bg: "#0A0D1A",
    bg2: "#0F1326",
    surface: "rgba(255,255,255,0.055)",
    surfaceStrong: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.10)",
    text: "#F2F1FB",
    textMuted: "rgba(242,241,251,0.62)",
    textFaint: "rgba(242,241,251,0.38)",
  },
  light: {
    bg: "#F5F5FB",
    bg2: "#FFFFFF",
    surface: "rgba(255,255,255,0.75)",
    surfaceStrong: "rgba(255,255,255,0.95)",
    border: "rgba(20,18,31,0.08)",
    text: "#14121F",
    textMuted: "rgba(20,18,31,0.62)",
    textFaint: "rgba(20,18,31,0.40)",
  },
  primary: "#6D5DF6",
  primary2: "#A855F7",
  amber: "#F5A524",
  like: "#FB4570",
  super: "#38BDF8",
  ggits: "#6D5DF6",
  ggct: "#38BDF8",
  ggce: "#F5A524",
};

const COLLEGE_COLOR = { GGITS: TOKENS.ggits, GGCT: TOKENS.ggct, GGCE: TOKENS.ggce };
const COLLEGE_COLOR_PALETTE = [TOKENS.primary, TOKENS.super, TOKENS.amber, TOKENS.primary2, "#34D399", "#FB7185"];
// CampusMate now supports any college a student adds, not just the three
// launch colleges — this gives every college a stable, deterministic color
// (same name always -> same color) instead of crashing/graying out on an
// unrecognized code.
function collegeColor(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (COLLEGE_COLOR[normalizedCode]) {
    return COLLEGE_COLOR[normalizedCode];
  }

  let hash = 0;

  for (let i = 0; i < normalizedCode.length; i++) {
    hash = (hash * 31 + normalizedCode.charCodeAt(i)) >>> 0;
  }

  return COLLEGE_COLOR_PALETTE[
    hash % COLLEGE_COLOR_PALETTE.length
  ];
}

/* ============================================================
   DEMO DATA — clearly marked as sample/demo, not real records
   ============================================================ */

const COLLEGES = [
  { code: "GGITS", name: "Gyan Ganga Institute of Technology & Science", students: 3120, clubs: 14 },
  { code: "GGCT", name: "Gyan Ganga College of Technology", students: 2480, clubs: 11 },
  { code: "GGCE", name: "Gyan Ganga College of Engineering", students: 1960, clubs: 9 },
];

const BRANCHES = ["CSE", "CSE-DS", "CSE-AIML", "IT", "ECE", "EE", "Mechanical", "Civil", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const INTEREST_POOL = ["AI/ML", "Web Dev", "Coding", "Robotics", "Cricket", "Music", "Photography", "Design", "Startups", "Gaming", "Football", "Dance", "Writing", "Open Source"];
const LOOKING_FOR = ["Friends", "Study Partner", "Project Partner", "Hackathon Team", "Networking", "Club", "Events", "Dating"];

const STUDENTS = [
  { id: 1, name: "Rahul Sharma", age: 21, branch: "CSE", year: "3rd Year", college: "GGITS", bio: "Building AI projects and losing sleep over hackathons.", interests: ["AI/ML", "Coding", "Cricket"], lookingFor: "Hackathon Team", matchesBack: true },
  { id: 2, name: "Priya Verma", age: 20, branch: "CSE-DS", year: "2nd Year", college: "GGCT", bio: "Data nerd, chai enthusiast, occasional poet.", interests: ["AI/ML", "Writing", "Music"], lookingFor: "Study Partner", matchesBack: true },
  { id: 3, name: "Aditya Singh", age: 22, branch: "Mechanical", year: "4th Year", college: "GGCE", bio: "CAD by day, football by evening.", interests: ["Robotics", "Football"], lookingFor: "Networking" },
  { id: 4, name: "Ishita Rao", age: 20, branch: "ECE", year: "2nd Year", college: "GGCT", bio: "Circuits, synths, and stage lights.", interests: ["Music", "Design"], lookingFor: "Club" },
  { id: 5, name: "Karan Mehta", age: 21, branch: "IT", year: "3rd Year", college: "GGITS", bio: "Full-stack by day, competitive gamer by night.", interests: ["Web Dev", "Gaming", "Open Source"], lookingFor: "Project Partner", matchesBack: true },
  { id: 6, name: "Ananya Joshi", age: 19, branch: "Civil", year: "1st Year", college: "GGCE", bio: "New here, exploring every club before I pick one.", interests: ["Photography", "Dance"], lookingFor: "Friends" },
  { id: 7, name: "Yash Patel", age: 22, branch: "CSE-AIML", year: "4th Year", college: "GGITS", bio: "Training models, mostly training patience.", interests: ["AI/ML", "Startups"], lookingFor: "Networking" },
  { id: 8, name: "Sneha Kulkarni", age: 20, branch: "EE", year: "2nd Year", college: "GGCT", bio: "Powers systems by day, sketchbook by night.", interests: ["Design", "Photography"], lookingFor: "Dating" },
  { id: 9, name: "Devansh Rathore", age: 21, branch: "CSE", year: "3rd Year", college: "GGCE", bio: "Open-source contributor, chronic overcommitter.", interests: ["Open Source", "Coding", "Startups"], lookingFor: "Hackathon Team" },
  { id: 10, name: "Meera Nair", age: 19, branch: "IT", year: "1st Year", college: "GGITS", bio: "Front-end obsessive. Ask me about type scales.", interests: ["Web Dev", "Design"], lookingFor: "Friends" },
];

const CLUBS = [
  { id: 1, name: "Coding Club", college: "GGITS", members: 412, desc: "Weekly DSA sprints and open-source Fridays.", icon: BookOpen },
  { id: 2, name: "Robotics Club", college: "GGCE", members: 268, desc: "Autonomous bots and the annual RoboWar.", icon: Zap },
  { id: 3, name: "AI/ML Club", college: "GGCT", members: 355, desc: "Paper reading circles and Kaggle nights.", icon: Sparkles },
  { id: 4, name: "Entrepreneurship Cell", college: "GGITS", members: 190, desc: "Pitch nights, founder AMAs, campus incubation.", icon: Briefcase },
  { id: 5, name: "Cultural Club", college: "GGCT", members: 501, desc: "Fests, fine arts, and the annual cultural night.", icon: PartyPopper },
  { id: 6, name: "Photography Club", college: "GGCE", members: 147, desc: "Campus walks, gear talk, monthly exhibits.", icon: Camera },
];

const EVENTS = [
  { id: 1, title: "Hackathon 2026", college: "GGITS", date: "24 Aug", time: "10:00 AM", participants: 120 },
  { id: 2, title: "AI/ML Bootcamp", college: "GGCT", date: "29 Aug", time: "11:00 AM", participants: 84 },
  { id: 3, title: "RoboWar Finals", college: "GGCE", date: "3 Sep", time: "2:00 PM", participants: 96 },
  { id: 4, title: "Startup Pitch Night", college: "GGITS", date: "9 Sep", time: "5:00 PM", participants: 60 },
  { id: 5, title: "Cultural Fest — Sanskriti", college: "GGCT", date: "14 Sep", time: "4:00 PM", participants: 310 },
  { id: 6, title: "Placement Prep Workshop", college: "GGCE", date: "18 Sep", time: "10:30 AM", participants: 142 },
];

const TIMELINE = [
  { time: "10:00 AM", label: "Registration" },
  { time: "11:00 AM", label: "Opening Ceremony" },
  { time: "12:00 PM", label: "Competition Begins" },
  { time: "04:00 PM", label: "Evaluation" },
  { time: "06:00 PM", label: "Results" },
];

/* ---- PHASE 2: social layer demo data (clearly sample/dev data) ---- */

const HASHTAGS = ["#GGITS", "#GGCT", "#GGCE", "#CampusLife", "#Hackathon", "#CollegeFest", "#Coding", "#RoboWar"];

// Components like PostCard/ReelCard/SwipeCard look authors up by id via byId()
// rather than carrying a full author object — that's fine for the local demo
// dataset (STUDENTS), but breaks for live-fetched posts/reels whose authors
// aren't in that array. liveUserCache + registerLiveUser() let API data
// "become" a lookup-able pseudo-student without rewriting every card
// component to accept an author object directly. It's a pragmatic bridge for
// this stage, not a proper normalized store — a real refactor would replace
// authorId+byId with an embedded author object everywhere.
const liveUserCache = {};
function registerLiveUser(apiUser) {
  if (!apiUser?._id) return apiUser;
  const shaped = {
    id: apiUser._id, name: apiUser.name, age: null,
    branch: apiUser.branch || "", year: apiUser.year || "",
    college: apiUser.collegeName || apiUser.college || "Unknown",
    bio: apiUser.bio || "", interests: apiUser.interests || [],
    lookingFor: apiUser.lookingFor || "Networking",
    photoUrl: apiUser.profilePhoto?.url,
    verificationStatus: apiUser.verificationStatus,
  };
  liveUserCache[apiUser._id] = shaped;
  return shaped;
}
const byId = (id) => STUDENTS.find((s) => s.id === id) || liveUserCache[id] || { id, name: "Unknown", college: "—", interests: [] };

function adaptApiPost(p) {
  const author = registerLiveUser(p.author);
  return {
    id: p._id, authorId: p.author?._id, type: p.type,
    caption: p.caption || "", hashtags: p.hashtags || [],
    likesCount: p.likesCount ?? (p.likes?.length || 0), commentsCount: p.commentsCount || 0, savesCount: p.savesCount || 0,
    createdAt: timeAgo(p.createdAt), comments: [], media: p.media, college: author.college,
  };
}
function adaptApiReel(r) {
  const author = registerLiveUser(r.author);
  return {
    id: r._id, authorId: r.author?._id, caption: r.caption || "", audioName: r.audioName || "Original Audio",
    hashtags: r.hashtags || [], likesCount: r.likesCount ?? (r.likes?.length || 0), commentsCount: r.commentsCount || 0,
    views: r.viewsCount || 0, duration: r.duration, videoUrl: r.videoUrl, thumbnailUrl: r.thumbnailUrl, college: author.college,
  };
}
function adaptApiStudent(u) {
  return registerLiveUser(u);
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const POSTS = [
  { id: "p1", authorId: 1, type: "photo", caption: "Amazing day at campus! Prepping for Hackathon 2026 🔥", hashtags: ["#GGITS", "#Hackathon"], likesCount: 214, commentsCount: 2, savesCount: 12, createdAt: "2h ago",
    comments: [
      { id: "c1", authorId: 2, text: "Let's gooo! Save me a spot on the team 🙌", time: "1h ago" },
      { id: "c2", authorId: 5, text: "This is going to be epic", time: "40m ago" },
    ] },
  { id: "p2", authorId: 2, type: "carousel", images: 3, caption: "Weekend sketch dump from the CSE-DS studio ✏️", hashtags: ["#GGCT", "#CampusLife"], likesCount: 132, commentsCount: 1, savesCount: 8, createdAt: "5h ago",
    comments: [{ id: "c3", authorId: 8, text: "Your linework keeps getting better", time: "3h ago" }] },
  { id: "p3", authorId: 9, type: "text", caption: "PSA: open-source study group meets Thursday 6PM, all colleges welcome. Bring your laptops.", hashtags: ["#Coding", "#GGCE"], likesCount: 58, commentsCount: 0, savesCount: 3, createdAt: "8h ago", comments: [] },
  { id: "p4", authorId: 3, type: "club", club: "Robotics Club", caption: "RoboWar bot v3 just cleared its first obstacle course run 🤖", hashtags: ["#GGCE", "#RoboWar"], likesCount: 301, commentsCount: 1, savesCount: 19, createdAt: "1d ago",
    comments: [{ id: "c4", authorId: 1, text: "The turning radius on that thing is insane", time: "20h ago" }] },
  { id: "p5", authorId: 4, type: "photo", caption: "Soundcheck before the Sanskriti fest rehearsal 🎶", hashtags: ["#GGCT", "#CollegeFest"], likesCount: 176, commentsCount: 0, savesCount: 6, createdAt: "1d ago", comments: [] },
  { id: "p6", authorId: 7, type: "event", event: "AI/ML Bootcamp", caption: "Two seats left in the AI/ML bootcamp waitlist — DM to grab one.", hashtags: ["#GGITS", "#Coding"], likesCount: 94, commentsCount: 0, savesCount: 15, createdAt: "2d ago", comments: [] },
];

const REELS = [
  { id: "r1", authorId: 1, caption: "Campus vibes before the hackathon 🔥", audio: "Original Audio — Rahul Sharma", hashtags: ["#GGITS", "#Hackathon"], likesCount: 2400, commentsCount: 120, savesCount: 88, views: 12430 },
  { id: "r2", authorId: 4, caption: "60 seconds inside the Sanskriti fest rehearsal 🎶", audio: "Original Audio — Ishita Rao", hashtags: ["#GGCT", "#CollegeFest"], likesCount: 1830, commentsCount: 64, savesCount: 51, views: 9820 },
  { id: "r3", authorId: 3, caption: "RoboWar bot survives round 1 🤖", audio: "trending campus beat", hashtags: ["#GGCE", "#RoboWar"], likesCount: 3120, commentsCount: 210, savesCount: 140, views: 21040 },
  { id: "r4", authorId: 9, caption: "POV: your PR finally gets merged", audio: "Original Audio — Devansh Rathore", hashtags: ["#Coding", "#GGCE"], likesCount: 980, commentsCount: 40, savesCount: 22, views: 5310 },
  { id: "r5", authorId: 5, caption: "Late night debugging with the squad", audio: "lofi campus mix", hashtags: ["#GGITS", "#CampusLife"], likesCount: 1540, commentsCount: 76, savesCount: 33, views: 8010 },
];

const STORIES = [
  { id: "s1", authorId: 1, seen: false },
  { id: "s2", authorId: 2, seen: false },
  { id: "s3", authorId: 3, seen: false },
  { id: "s4", authorId: 4, seen: true },
  { id: "s5", authorId: 5, seen: false },
];

const SOCIAL_NOTIFS = [
  { id: "n1", icon: Heart, color: TOKENS.like, text: "Priya Verma liked your post", time: "12m ago" },
  { id: "n2", icon: MessageCircle, color: TOKENS.super, text: "Karan Mehta commented: \u201cLet's team up!\u201d", time: "34m ago" },
  { id: "n3", icon: UserPlus, color: TOKENS.primary, text: "Ananya Joshi started following you", time: "1h ago" },
  { id: "n4", icon: Repeat2, color: TOKENS.amber, text: "Your reel was shared 8 times", time: "3h ago" },
  { id: "n5", icon: Calendar, color: TOKENS.primary2, text: "Hackathon 2026 starts in 2 days", time: "5h ago" },
];

/* ============================================================
   GLOBAL STYLE (fonts, keyframes, scrollbar)
   ============================================================ */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      .cm-root { font-family: 'Inter', sans-serif; }
      .cm-display { font-family: 'Space Grotesk', sans-serif; }
      .cm-root ::-webkit-scrollbar { width: 6px; height: 6px; }
      .cm-root ::-webkit-scrollbar-thumb { background: rgba(128,120,200,0.35); border-radius: 999px; }

      @keyframes cmFloat { 0%,100% { transform: translate(0,0); } 50% { transform: translate(14px,-18px); } }
      @keyframes cmFloatSlow { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-16px,12px) scale(1.05); } }
      @keyframes cmPulseLine { 0%,100% { opacity: .25; } 50% { opacity: .9; } }
      @keyframes cmPop { 0% { opacity:0; transform: scale(.85) translateY(8px); } 100% { opacity:1; transform: scale(1) translateY(0); } }
      @keyframes cmFadeUp { 0% { opacity:0; transform: translateY(14px); } 100% { opacity:1; transform: translateY(0); } }
      @keyframes cmSpin { to { transform: rotate(360deg); } }
      @keyframes cmDot { 0%,80%,100% { opacity:.25; transform: translateY(0); } 40% { opacity:1; transform: translateY(-3px); } }
      @keyframes cmRing { 0% { transform: scale(0.6); opacity: .9; } 100% { transform: scale(2.4); opacity: 0; } }
      @keyframes cmShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      @keyframes cmMatchPop { 0% { opacity:0; transform: scale(.5) rotate(-8deg);} 60% { opacity:1; transform: scale(1.08) rotate(2deg);} 100% { opacity:1; transform: scale(1) rotate(0);} }
      @keyframes cmDoubleHeart { 0% { opacity:0; transform: scale(.3); } 30% { opacity:1; transform: scale(1.15); } 45% { transform: scale(1); } 100% { opacity:0; transform: scale(1) translateY(-14px); } }
      @keyframes cmSheetUp { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
      @keyframes cmSpinSlow { to { transform: rotate(360deg); } }

      @media (prefers-reduced-motion: reduce) {
        .cm-root *, .cm-root *::before, .cm-root *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      }
    `}</style>
  );
}

/* ============================================================
   SMALL PRIMITIVES
   ============================================================ */

function useTheme() {
  const [dark, setDark] = useState(true);
  const t = dark ? TOKENS.dark : TOKENS.light;
  return { dark, setDark, t };
}

function Logo({ t, size = 26 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
        <circle cx="20" cy="20" r="3.6" fill={TOKENS.primary} />
        <circle cx="8" cy="30" r="3" fill={TOKENS.ggct} />
        <circle cx="32" cy="30" r="3" fill={TOKENS.amber} />
        <line x1="20" y1="20" x2="8" y2="30" stroke={t.textFaint} strokeWidth="1.4" />
        <line x1="20" y1="20" x2="32" y2="30" stroke={t.textFaint} strokeWidth="1.4" />
        <line x1="8" y1="30" x2="32" y2="30" stroke={t.textFaint} strokeWidth="1.4" />
      </svg>
      <span className="cm-display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3, color: t.text }}>
        CampusMate
      </span>
    </div>
  );
}

function Badge({ children, color, style }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
        padding: "3px 9px", borderRadius: 999,
        color: "#fff", background: color, ...style,
      }}
    >
      {children}
    </span>
  );
}

function GlassCard({ t, children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: 20, backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)", ...style,
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, style, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primary2})`,
        color: "#fff", border: "none", borderRadius: 14,
        padding: "13px 22px", fontSize: 14.5, fontWeight: 700,
        cursor: "pointer", boxShadow: "0 10px 30px -10px rgba(109,93,246,0.65)",
        transition: "transform .15s ease, box-shadow .15s ease", ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children} {Icon && <Icon size={16} />}
    </button>
  );
}

function GhostButton({ children, onClick, t, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", color: t.text, border: `1px solid ${t.border}`,
        borderRadius: 14, padding: "13px 22px", fontSize: 14.5, fontWeight: 600,
        cursor: "pointer", transition: "background .15s ease", ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = t.surface)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function CollegePill({ code, active, onClick }) {
  const color = collegeColor(code) || TOKENS.primary;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700,
        cursor: "pointer", border: `1.5px solid ${active ? color : "rgba(128,128,128,0.25)"}`,
        background: active ? color : "transparent",
        color: active ? "#fff" : color, whiteSpace: "nowrap",
        transition: "all .15s ease",
      }}
    >
      {code}
    </button>
  );
}

function AnimatedNumber({ value, t }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, start;
    const dur = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="cm-display" style={{ fontSize: 26, fontWeight: 700, color: t.text }}>{n}</span>;
}

/* ============================================================
   LANDING PAGE
   ============================================================ */

function TriCampusVisual({ t, size = 320 }) {
  const nodes = [
    { code: "GGITS", x: size * 0.5, y: size * 0.14, color: TOKENS.ggits },
    { code: "GGCT", x: size * 0.15, y: size * 0.82, color: TOKENS.ggct },
    { code: "GGCE", x: size * 0.85, y: size * 0.82, color: TOKENS.amber },
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: "100%" }}>
      <defs>
        <radialGradient id="cmGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={TOKENS.primary} stopOpacity="0.35" />
          <stop offset="100%" stopColor={TOKENS.primary} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={size * 0.46} fill="url(#cmGlow)" />
      {nodes.map((n, i) => (
        <line key={i} x1={size / 2} y1={size / 2} x2={n.x} y2={n.y}
          stroke={n.color} strokeWidth="1.6" strokeDasharray="4 5"
          style={{ animation: `cmPulseLine 2.6s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
      <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[1].x} y2={nodes[1].y} stroke={t.textFaint} strokeWidth="1.2" />
      <line x1={nodes[1].x} y1={nodes[1].y} x2={nodes[2].x} y2={nodes[2].y} stroke={t.textFaint} strokeWidth="1.2" />
      <line x1={nodes[2].x} y1={nodes[2].y} x2={nodes[0].x} y2={nodes[0].y} stroke={t.textFaint} strokeWidth="1.2" />
      <circle cx={size / 2} cy={size / 2} r="9" fill={t.text} />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="16" fill={n.color} opacity="0.18" style={{ animation: `cmFloatSlow ${4 + i}s ease-in-out infinite` }} />
          <circle cx={n.x} cy={n.y} r="9" fill={n.color} />
          <text x={n.x} y={n.y - 20} textAnchor="middle" fontSize="12" fontWeight="700" fill={t.text} fontFamily="Space Grotesk, sans-serif">
            {n.code}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LandingPage({ t, dark, setDark, onStart }) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: t.bg, color: t.text }}>
      {/* ambient blobs */}
      <div style={{ position: "absolute", top: -120, left: -100, width: 380, height: 380, borderRadius: "50%",
        background: `radial-gradient(circle, ${TOKENS.primary}55, transparent 70%)`, filter: "blur(10px)",
        animation: "cmFloat 9s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: -140, right: -100, width: 420, height: 420, borderRadius: "50%",
        background: `radial-gradient(circle, ${TOKENS.amber}44, transparent 70%)`, filter: "blur(10px)",
        animation: "cmFloatSlow 11s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "22px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo t={t} />
          <button onClick={() => setDark(!dark)} style={{
            width: 38, height: 38, borderRadius: 12, border: `1px solid ${t.border}`,
            background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            {dark ? <Sun size={16} color={t.text} /> : <Moon size={16} color={t.text} />}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40, marginTop: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "cmFadeUp .6s ease both" }}>
            <Badge color={TOKENS.primary} style={{ width: "fit-content" }}>
              <Sparkles size={11} /> ONE CAMPUS · THREE COLLEGES
            </Badge>
            <h1 className="cm-display" style={{ fontSize: "clamp(34px,7vw,58px)", lineHeight: 1.05, fontWeight: 700, margin: 0, letterSpacing: -1 }}>
              Connect. Match.<br />
              <span style={{ background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.amber})`, WebkitBackgroundClip: "text", color: "transparent" }}>
                Belong.
              </span>
            </h1>
            <p style={{ fontSize: 16.5, color: t.textMuted, maxWidth: 480, lineHeight: 1.6 }}>
              CampusMate brings <strong style={{ color: t.text }}>GGITS</strong>, <strong style={{ color: t.text }}>GGCT</strong> and{" "}
              <strong style={{ color: t.text }}>GGCE</strong> onto one digital campus — meet students, build friendships,
              find teammates, and discover what's happening across Gyan Ganga, Jabalpur.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
              <PrimaryButton onClick={onStart} icon={ArrowRight}>Get Started</PrimaryButton>
              <GhostButton t={t} onClick={onStart}>Explore Campus</GhostButton>
            </div>
            <div style={{ display: "flex", gap: 22, marginTop: 10, flexWrap: "wrap" }}>
              {COLLEGES.map((c) => (
                <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: collegeColor(c.code) }} />
                  <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 600 }}>{c.code}</span>
                </div>
              ))}
              <span style={{ fontSize: 11.5, color: t.textFaint }}>· demo figures shown in-app</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", animation: "cmFadeUp .8s ease .1s both" }}>
            <GlassCard t={t} style={{ padding: 28, width: "100%", maxWidth: 420 }}>
              <TriCampusVisual t={t} size={320} />
              <p style={{ textAlign: "center", fontSize: 12.5, color: t.textFaint, marginTop: 4 }}>
                The tri-campus network — students, clubs and events, all linked.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* value chain */}
        <div style={{ marginTop: 70 }}>
          <h3 className="cm-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Not just matching — a whole ecosystem</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 14 }}>
            {[
              { icon: Heart, label: "Matches", color: TOKENS.like },
              { icon: Users, label: "Friends", color: TOKENS.primary },
              { icon: Briefcase, label: "Project Teams", color: TOKENS.super },
              { icon: GraduationCap, label: "Clubs", color: TOKENS.amber },
              { icon: Calendar, label: "Events", color: TOKENS.primary2 },
              { icon: TrendingUp, label: "Opportunities", color: TOKENS.ggct },
            ].map((v, i) => (
              <GlassCard key={i} t={t} style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${v.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <v.icon size={17} color={v.color} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: t.text }}>{v.label}</span>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ONBOARDING
   ============================================================ */

function StepDots({ step, total, t }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 999,
          background: i <= step ? `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.primary2})` : t.border,
          transition: "background .3s ease",
        }} />
      ))}
    </div>
  );
}

function Onboarding({ t, profile, setProfile, onFinish }) {
  const [step, setStep] = useState(0);
  const total = 7;

  const toggleFrom = (key, val, max) => {
    setProfile((p) => {
      const list = p[key] || [];
      if (list.includes(val)) return { ...p, [key]: list.filter((x) => x !== val) };
      if (max && list.length >= max) return p;
      return { ...p, [key]: [...list, val] };
    });
  };

  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const canNext = [
    true,
    !!profile.college,
    !!profile.branch && !!profile.year,
    profile.bio.trim().length > 0,
    profile.interests.length > 0,
    !!profile.lookingFor,
    true,
  ][step];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 18px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Logo t={t} />
        <div style={{ marginTop: 22, marginBottom: 22 }}>
          <StepDots step={step} total={total} t={t} />
        </div>

        <GlassCard t={t} style={{ padding: 26, minHeight: 380, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div key={step} style={{ animation: "cmFadeUp .35s ease both" }}>
            {step === 0 && (
              <div style={{ textAlign: "center", paddingTop: 20 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                  <TriCampusVisual t={t} size={180} />
                </div>
                <h2 className="cm-display" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Welcome to CampusMate 👋</h2>
                <p style={{ color: t.textMuted, fontSize: 14.5, lineHeight: 1.6 }}>One campus. Three colleges. Endless connections.</p>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Which college are you from?</h2>
                <p style={{ color: t.textFaint, fontSize: 13, marginBottom: 18 }}>This shows on your profile with a verified badge.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {COLLEGES.map((c) => (
                    <button key={c.code} onClick={() => setProfile((p) => ({ ...p, college: c.code }))}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                        border: `1.5px solid ${profile.college === c.code ? collegeColor(c.code) : t.border}`,
                        background: profile.college === c.code ? `${collegeColor(c.code)}18` : "transparent",
                      }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: t.text }}>{c.code}</div>
                        <div style={{ fontSize: 12, color: t.textFaint }}>{c.name}</div>
                      </div>
                      {profile.college === c.code && <CheckCircle2 size={18} color={collegeColor(c.code)} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Branch & year</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {BRANCHES.map((b) => (
                    <button key={b} onClick={() => setProfile((p) => ({ ...p, branch: b }))}
                      style={{
                        padding: "8px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${profile.branch === b ? TOKENS.primary : t.border}`,
                        background: profile.branch === b ? `${TOKENS.primary}22` : "transparent",
                        color: profile.branch === b ? t.text : t.textMuted,
                      }}>{b}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {YEARS.map((y) => (
                    <button key={y} onClick={() => setProfile((p) => ({ ...p, year: y }))}
                      style={{
                        padding: "8px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                        border: `1.5px solid ${profile.year === y ? TOKENS.primary2 : t.border}`,
                        background: profile.year === y ? `${TOKENS.primary2}22` : "transparent",
                        color: profile.year === y ? t.text : t.textMuted,
                      }}>{y}</button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Add a bio</h2>
                <p style={{ color: t.textFaint, fontSize: 13, marginBottom: 14 }}>One or two lines. Make it yours.</p>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value.slice(0, 140) }))}
                  placeholder="Building AI projects and losing sleep over hackathons..."
                  rows={4}
                  style={{
                    width: "100%", resize: "none", borderRadius: 14, padding: 14, fontSize: 14,
                    background: "transparent", color: t.text, border: `1.5px solid ${t.border}`, fontFamily: "Inter, sans-serif",
                  }}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: t.textFaint, marginTop: 4 }}>{profile.bio.length}/140</div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Your interests</h2>
                <p style={{ color: t.textFaint, fontSize: 13, marginBottom: 14 }}>Pick up to 6 — this powers your match score.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {INTEREST_POOL.map((i) => {
                    const active = profile.interests.includes(i);
                    return (
                      <button key={i} onClick={() => toggleFrom("interests", i, 6)}
                        style={{
                          padding: "8px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                          border: `1.5px solid ${active ? TOKENS.amber : t.border}`,
                          background: active ? `${TOKENS.amber}22` : "transparent",
                          color: active ? t.text : t.textMuted,
                        }}>{i}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>What are you looking for?</h2>
                <p style={{ color: t.textFaint, fontSize: 13, marginBottom: 14 }}>You can change this anytime.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {LOOKING_FOR.map((l) => (
                    <button key={l} onClick={() => setProfile((p) => ({ ...p, lookingFor: l }))}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "11px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                        border: `1.5px solid ${profile.lookingFor === l ? TOKENS.primary : t.border}`,
                        background: profile.lookingFor === l ? `${TOKENS.primary}18` : "transparent",
                        color: t.text, fontSize: 13.5, fontWeight: 600,
                      }}>
                      {l} {profile.lookingFor === l && <Check size={15} color={TOKENS.primary} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="cm-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>Preview your profile</h2>
                <GlassCard t={t} style={{ padding: 18 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.amber})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>
                      {profile.name?.[0] || "Y"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{profile.name || "You"}</div>
                      <div style={{ fontSize: 12, color: t.textMuted }}>{profile.branch || "Branch"} • {profile.year || "Year"}</div>
                      {profile.college && <Badge color={collegeColor(profile.college)} style={{ marginTop: 4 }}>{profile.college}</Badge>}
                    </div>
                  </div>
                  {profile.bio && <p style={{ fontSize: 13, color: t.textMuted, marginTop: 12 }}>{profile.bio}</p>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                    {profile.interests.map((i) => <Badge key={i} color="rgba(128,120,200,0.5)">{i}</Badge>)}
                  </div>
                </GlassCard>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
            <GhostButton t={t} onClick={back} style={{ opacity: step === 0 ? 0.35 : 1, pointerEvents: step === 0 ? "none" : "auto" }}>
              <ChevronLeft size={15} style={{ marginRight: 2, display: "inline" }} /> Back
            </GhostButton>
            {step < total - 1 ? (
              <PrimaryButton onClick={next} icon={ChevronRight} style={{ opacity: canNext ? 1 : 0.4, pointerEvents: canNext ? "auto" : "none" }}>
                Continue
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={onFinish} icon={Sparkles}>Enter CampusMate</PrimaryButton>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* ============================================================
   PHASE 2 — SOCIAL PRIMITIVES
   ============================================================ */

function HashtagPill({ tag, onClick, active, t }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 999,
      fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      border: `1.5px solid ${active ? TOKENS.amber : t.border}`,
      background: active ? `${TOKENS.amber}22` : t.surface, color: active ? t.text : t.textMuted,
    }}>{tag}</button>
  );
}

function TrendingHashtags({ t, onPick }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>🔥</span>
        <h3 className="cm-display" style={{ fontSize: 15.5, fontWeight: 700, margin: 0 }}>Trending on Campus</h3>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {HASHTAGS.map((h) => <HashtagPill key={h} tag={h} t={t} onClick={() => onPick(h)} />)}
      </div>
    </div>
  );
}

function StoriesRow({ t, profile, onOpen }) {
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "4px 2px 12px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{
          width: 58, height: 58, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          border: `1.5px dashed ${t.border}`, position: "relative",
        }}>
          <Avatar name={profile.name || "You"} color={TOKENS.primary} size={50} />
          <div style={{
            position: "absolute", bottom: -2, right: -2, width: 19, height: 19, borderRadius: "50%",
            background: TOKENS.primary, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${t.bg}`,
          }}><Plus size={11} color="#fff" /></div>
        </div>
        <span style={{ fontSize: 10.5, color: t.textMuted, fontWeight: 600 }}>Your Story</span>
      </div>
      {STORIES.map((s) => {
        const a = byId(s.authorId);
        return (
          <button key={s.id} onClick={() => onOpen(s)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%", padding: 2.5,
              background: s.seen ? t.border : `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.amber})`,
            }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `2px solid ${t.bg}`, overflow: "hidden" }}>
                <Avatar name={a.name} color={collegeColor(a.college)} size={51} />
              </div>
            </div>
            <span style={{ fontSize: 10.5, color: t.textMuted, fontWeight: 600, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

function StoryViewer({ t, story, onClose, profile }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); onClose(); return 100; }
        return p + 1.2;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [story]);
  if (!story) return null;
  const a = byId(story.authorId);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", animation: "cmFadeUp .2s ease both" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 420, height: "100%", maxHeight: 780, background: `linear-gradient(160deg, ${collegeColor(a.college)}55, #05060c)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", gap: 4 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#fff" }} />
          </div>
        </div>
        <div style={{ position: "absolute", top: 22, left: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={a.name} color={collegeColor(a.college)} size={30} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{a.name}</span>
          <Badge color={collegeColor(a.college)}>{a.college}</Badge>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 14, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} />
        </button>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
          <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${collegeColor(a.college)}, ${TOKENS.primary2})` }} />
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, padding: "0 30px", textAlign: "center" }}>{a.bio}</p>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Demo story • disappears in 24h</span>
        </div>
        <button onClick={onClose} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "35%", background: "transparent", border: "none", cursor: "pointer" }} aria-label="Previous" />
        <button onClick={onClose} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "35%", background: "transparent", border: "none", cursor: "pointer" }} aria-label="Next" />
      </div>
    </div>
  );
}

function DoubleTapHeart({ show }) {
  if (!show) return null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <Heart size={90} color="#fff" fill={TOKENS.like} style={{ animation: "cmDoubleHeart .8s ease both", filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))" }} />
    </div>
  );
}

function PostMedia({ t, post, onDoubleLike }) {
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      onDoubleLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 750);
    }
    lastTap.current = now;
  };
  const a = byId(post.authorId);
  const grad = `linear-gradient(150deg, ${collegeColor(a.college)}77, ${TOKENS.primary2}55)`;
  if (post.type === "text") {
    return (
      <div onClick={handleTap} style={{ position: "relative", padding: "26px 20px", borderRadius: 16, background: grad, minHeight: 110, display: "flex", alignItems: "center", cursor: "pointer" }}>
        <p style={{ color: "#fff", fontSize: 15.5, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{post.caption}</p>
        <DoubleTapHeart show={burst} />
      </div>
    );
  }
  return (
    <div onClick={handleTap} style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 300, background: grad, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {post.type === "carousel" && (
        <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>1 / {post.images}</span>
      )}
      {(post.type === "club" || post.type === "event") && (
        <Badge color={TOKENS.amber} style={{ position: "absolute", top: 10, left: 10 }}>{post.type === "club" ? post.club : post.event}</Badge>
      )}
      <ImageIcon size={38} color="rgba(255,255,255,0.55)" />
      {post.type === "carousel" && (
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
          {Array.from({ length: post.images }).map((_, i) => (
            <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? "#fff" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      )}
      <DoubleTapHeart show={burst} />
    </div>
  );
}

function PostCard({ t, post, following, onToggleFollow, onLike, onSave, onOpenComments }) {
  const a = byId(post.authorId);
  const isFollowing = following.includes(post.authorId);
  return (
    <GlassCard t={t} style={{ padding: 16, marginBottom: 16, animation: "cmFadeUp .4s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={a.name} color={collegeColor(a.college)} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{a.name}</span>
            <CheckCircle2 size={13} color={TOKENS.super} />
          </div>
          <div style={{ fontSize: 11.5, color: t.textMuted }}>{a.college} • {a.branch} • {a.year} • {post.createdAt}</div>
        </div>
        {!isFollowing ? (
          <button onClick={() => onToggleFollow(post.authorId)} style={{ background: "none", border: `1.5px solid ${TOKENS.primary}`, color: TOKENS.primary, borderRadius: 999, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>Follow</button>
        ) : (
          <button onClick={() => onToggleFollow(post.authorId)} style={{ background: "none", border: `1.5px solid ${t.border}`, color: t.textFaint, borderRadius: 999, padding: "5px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><UserCheck size={12} /> Following</button>
        )}
        <button style={{ background: "none", border: "none", color: t.textFaint, cursor: "pointer", padding: 4 }}><MoreHorizontal size={16} /></button>
      </div>

      <div style={{ marginTop: 12 }}>
        <PostMedia t={t} post={post} onDoubleLike={() => !post.liked && onLike(post.id)} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        <button onClick={() => onLike(post.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: post.liked ? TOKENS.like : t.textMuted }}>
          <Heart size={19} fill={post.liked ? TOKENS.like : "none"} style={post.liked ? { animation: "cmPop .3s ease" } : {}} />
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{post.likesCount}</span>
        </button>
        <button onClick={() => onOpenComments(post)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: t.textMuted }}>
          <MessageCircle size={18} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>{post.commentsCount}</span>
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: t.textMuted }}>
          <Repeat2 size={18} /><span style={{ fontSize: 12.5, fontWeight: 700 }}>Share</span>
        </button>
        <button onClick={() => onSave(post.id)} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", color: post.saved ? TOKENS.amber : t.textMuted }}>
          <Bookmark size={18} fill={post.saved ? TOKENS.amber : "none"} />
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 13, color: t.text }}><strong>{a.name}</strong> {post.type !== "text" && post.caption}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {post.hashtags.map((h) => <span key={h} style={{ fontSize: 12, fontWeight: 700, color: TOKENS.primary }}>{h}</span>)}
        </div>
      </div>
    </GlassCard>
  );
}

function CommentsSheet({ t, post, profile, onClose, onAddComment }) {
  const [draft, setDraft] = useState("");
  if (!post) return null;
  const submit = () => {
    if (!draft.trim()) return;
    onAddComment(post.id, draft.trim());
    setDraft("");
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,14,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 480, maxHeight: "78vh", background: t.bg2,
        borderRadius: "22px 22px 0 0", border: `1px solid ${t.border}`, borderBottom: "none",
        display: "flex", flexDirection: "column", animation: "cmSheetUp .3s cubic-bezier(.2,.9,.3,1) both",
      }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="cm-display" style={{ fontWeight: 700, fontSize: 15, color: t.text }}>Comments · {post.commentsCount}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {post.comments.length === 0 && (
            <div style={{ textAlign: "center", color: t.textFaint, fontSize: 13, padding: "30px 0" }}>No comments yet. Start the conversation.</div>
          )}
          {post.comments.map((c) => {
            const a = byId(c.authorId);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10 }}>
                <Avatar name={a.name} color={collegeColor(a.college)} size={34} />
                <div>
                  <div style={{ fontSize: 12.5 }}><strong style={{ color: t.text }}>{a.name}</strong> <span style={{ color: t.textFaint }}>· {a.college}</span></div>
                  <div style={{ fontSize: 13, color: t.text, marginTop: 2 }}>{c.text}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: t.textFaint }}>{c.time}</span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: t.textFaint, fontWeight: 700 }}>Like</button>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: t.textFaint, fontWeight: 700 }}>Reply</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${t.border}`, display: "flex", gap: 10 }}>
          <Avatar name={profile.name || "You"} color={TOKENS.primary} size={32} />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a comment..." style={{ flex: 1, borderRadius: 999, border: `1.5px solid ${t.border}`, padding: "9px 14px", background: "transparent", color: t.text, fontSize: 13 }} />
          <button onClick={submit} style={{ background: "none", border: "none", color: TOKENS.primary, cursor: "pointer" }}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function CreateSheet({ t, onClose, onPublish }) {
  const [mode, setMode] = useState(null); // null | photo | text | reel | event | club
  const [caption, setCaption] = useState("");

  const options = [
    { key: "photo", label: "Photo Post", icon: ImageIcon, color: TOKENS.primary },
    { key: "reel", label: "Reel", icon: Clapperboard, color: TOKENS.like },
    { key: "text", label: "Text Post", icon: TypeIcon, color: TOKENS.super },
    { key: "event", label: "Event Post", icon: Calendar, color: TOKENS.amber },
    { key: "club", label: "Club Post", icon: Users, color: TOKENS.primary2 },
  ];

  const publish = () => {
    if (!caption.trim()) return;
    onPublish({ type: mode === "reel" ? "text" : mode, caption: caption.trim() });
    setCaption(""); setMode(null); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 95, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,14,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 460, background: t.bg2, borderRadius: "22px 22px 0 0",
        border: `1px solid ${t.border}`, borderBottom: "none", padding: 20, animation: "cmSheetUp .3s cubic-bezier(.2,.9,.3,1) both",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: t.border, margin: "0 auto 16px" }} />
        {!mode ? (
          <>
            <h3 className="cm-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Create</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {options.map((o) => (
                <button key={o.key} onClick={() => setMode(o.key)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 14, cursor: "pointer",
                  border: `1px solid ${t.border}`, background: "transparent", textAlign: "left",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${o.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <o.icon size={17} color={o.color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{o.label}</span>
                  <ChevronRight size={15} color={t.textFaint} style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button onClick={() => setMode(null)} style={{ background: "none", border: "none", cursor: "pointer", color: t.text }}><ChevronLeft size={18} /></button>
              <h3 className="cm-display" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>New {options.find((o) => o.key === mode)?.label}</h3>
            </div>
            {mode !== "text" && (
              <div style={{
                height: 150, borderRadius: 14, border: `1.5px dashed ${t.border}`, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14, color: t.textFaint,
              }}>
                {mode === "reel" ? <Film size={22} /> : <ImageIcon size={22} />}
                <span style={{ fontSize: 12.5 }}>{mode === "reel" ? "Upload a video (demo — no real upload)" : "Select image (demo — no real upload)"}</span>
              </div>
            )}
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." rows={3}
              style={{ width: "100%", resize: "none", borderRadius: 12, padding: 12, fontSize: 13.5, background: "transparent", color: t.text, border: `1.5px solid ${t.border}`, fontFamily: "Inter, sans-serif" }} />
            <PrimaryButton onClick={publish} style={{ width: "100%", marginTop: 14, justifyContent: "center" }} icon={ArrowRight}>Post to CampusMate</PrimaryButton>
          </>
        )}
      </div>
    </div>
  );
}

function NotificationsPanel({ t, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", top: 66, right: 20, width: 320, maxWidth: "88vw",
        background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 18, overflow: "hidden",
        boxShadow: "0 20px 50px -15px rgba(0,0,0,0.4)", animation: "cmPop .2s ease both",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${t.border}`, fontWeight: 700, fontSize: 14, color: t.text }}>Notifications</div>
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {SOCIAL_NOTIFS.map((n) => (
            <div key={n.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 16px", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${n.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <n.icon size={14} color={n.color} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: t.text, lineHeight: 1.4 }}>{n.text}</div>
                <div style={{ fontSize: 10.5, color: t.textFaint, marginTop: 2 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL / NAV
   ============================================================ */

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "explore", label: "Explore", icon: Users },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "profile", label: "Profile", icon: User },
];

const SIDEBAR_ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "discover", label: "Discover", icon: Compass },
  { key: "explore", label: "Explore", icon: Users },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "profile", label: "Profile", icon: User },
];

function Shell({ t, dark, setDark, tab, setTab, children, unread, onCreate, connectionStatus }) {
  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex" }}>
      {/* desktop sidebar */}
      <div className="cm-sidebar" style={{
        width: 220, borderRight: `1px solid ${t.border}`, padding: "22px 14px",
        display: "flex", flexDirection: "column", gap: 4, flexShrink: 0,
      }}>
        <div style={{ padding: "0 8px 10px" }}><Logo t={t} /></div>
        {connectionStatus && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px 14px", fontSize: 10.5, fontWeight: 700, color: t.textFaint }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connectionStatus === "online" ? TOKENS.super : TOKENS.amber }} />
            {connectionStatus === "online" ? "CONNECTED" : "DEMO MODE — LOCAL DATA"}
          </div>
        )}
        <PrimaryButton onClick={onCreate} icon={Plus} style={{ margin: "0 4px 14px", justifyContent: "center" }}>Create</PrimaryButton>
        {SIDEBAR_ITEMS.map((it) => {
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12,
              border: "none", cursor: "pointer", textAlign: "left",
              background: active ? `${TOKENS.primary}1f` : "transparent",
              color: active ? TOKENS.primary : t.textMuted, fontWeight: active ? 700 : 600, fontSize: 14,
              position: "relative",
            }}>
              <it.icon size={17} />
              {it.label}
              {it.key === "messages" && unread > 0 && (
                <span style={{ marginLeft: "auto", background: TOKENS.like, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{unread}</span>
              )}
            </button>
          );
        })}
        <div style={{ marginTop: "auto" }}>
          <button onClick={() => setDark(!dark)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px",
            borderRadius: 12, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: 76 }}>
        {children}
      </div>

      {/* mobile bottom nav */}
      <div className="cm-bottomnav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, display: "none",
        background: t.bg2, borderTop: `1px solid ${t.border}`, padding: "8px 6px",
        justifyContent: "space-around", alignItems: "center", zIndex: 40,
      }}>
        {NAV_ITEMS.slice(0, 2).map((it) => {
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "transparent", border: "none", cursor: "pointer", padding: 6,
              color: active ? TOKENS.primary : t.textFaint, position: "relative",
            }}>
              <it.icon size={19} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</span>
            </button>
          );
        })}
        <button onClick={onCreate} style={{
          width: 46, height: 46, borderRadius: 16, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primary2})`, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: -18,
          boxShadow: "0 10px 24px -8px rgba(109,93,246,0.7)",
        }}><Plus size={22} /></button>
        {NAV_ITEMS.slice(2).map((it) => {
          const active = tab === it.key;
          return (
            <button key={it.key} onClick={() => setTab(it.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: "transparent", border: "none", cursor: "pointer", padding: 6,
              color: active ? TOKENS.primary : t.textFaint, position: "relative",
            }}>
              <it.icon size={19} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</span>
              {it.key === "messages" && unread > 0 && (
                <span style={{ position: "absolute", top: 2, right: 10, width: 7, height: 7, borderRadius: "50%", background: TOKENS.like }} />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .cm-sidebar { display: none; }
          .cm-bottomnav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function TopBar({ t, title, subtitle, onBell }) {
  return (
    <div style={{ padding: "22px 24px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <h1 className="cm-display" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      <button onClick={onBell} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
        <Bell size={16} color={t.text} />
        <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: TOKENS.like, border: `2px solid ${t.bg}` }} />
      </button>
    </div>
  );
}

/* ============================================================
   HOME
   ============================================================ */

const FEED_FILTERS = ["For You", "Following", "GGITS", "GGCT", "GGCE"];

function AnnouncementsRow({ t }) {
  const announcements = [
    { icon: GraduationCap, text: "CampusMate now works for any college — search for yours or add it during signup.", color: TOKENS.primary },
    { icon: Users, text: "Networking, study partners, and hackathon teammates — dating is just one of many reasons to connect.", color: TOKENS.amber },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0" }}>
      {announcements.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderRadius: 12, background: `${a.color}14`, border: `1px solid ${a.color}33` }}>
          <a.icon size={15} color={a.color} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: t.textMuted }}>{a.text}</span>
        </div>
      ))}
    </div>
  );
}

function Feed({ t, profile, authUser, matches, posts, following, onToggleFollow, onLike, onSave, onOpenComments,
                onOpenStory, onBell, setTab, onGoDiscover, onCreateStory }) {
  const stats = [
    { icon: Heart, label: "Matches", value: matches.length, color: TOKENS.like },
    { icon: MessageCircle, label: "Messages", value: matches.length ? matches.length + 3 : 0, color: TOKENS.super },
    { icon: Users, label: "Connections", value: following.length, color: TOKENS.primary },
    { icon: Calendar, label: "Events", value: 4, color: TOKENS.amber },
  ];

  return (
    <div>
      <TopBar t={t} title={`Good morning, ${profile.name?.split(" ")[0] || "there"} 👋`} subtitle="Your campus. Your community." onBell={onBell} />
      <div style={{ padding: "6px 24px" }}>
        {authUser ? <NativeStories me={authUser} t={t} onCreate={onCreateStory} /> : <StoriesRow t={t} profile={profile} onOpen={onOpenStory} />}

        <AnnouncementsRow t={t} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 10, margin: "20px 0" }}>
          {stats.map((s, i) => (
            <GlassCard key={i} t={t} style={{ padding: 14, animation: `cmFadeUp .4s ease ${i * 0.06}s both` }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <s.icon size={13} color={s.color} />
              </div>
              <AnimatedNumber value={s.value} t={t} />
              <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{s.label}</div>
            </GlassCard>
          ))}
        </div>

        <GlassCard t={t} onClick={onGoDiscover} style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 22, border: `1px solid ${TOKENS.primary}44` }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${TOKENS.like}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={18} color={TOKENS.like} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: t.text }}>Meet new students</div>
            <div style={{ fontSize: 11.5, color: t.textMuted }}>Find friends, project partners & teammates across all colleges</div>
          </div>
          <ChevronRight size={16} color={t.textFaint} />
        </GlassCard>

        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="cm-display" style={{ fontSize: 16, fontWeight: 700 }}>Recommended Students</h3>
          <button onClick={() => setTab("explore")} style={{ background: "none", border: "none", color: TOKENS.primary, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginTop: 10 }}>
          {STUDENTS.slice(0, 6).map((s) => (
            <GlassCard key={s.id} t={t} style={{ padding: 14, minWidth: 150, flexShrink: 0, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center" }}><Avatar name={s.name} color={collegeColor(s.college)} size={48} /></div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: t.text, marginTop: 8 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>{s.college}</div>
              <button onClick={() => onToggleFollow(s.id)} style={{
                marginTop: 8, width: "100%", padding: "6px 0", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${following.includes(s.id) ? t.border : TOKENS.primary}`,
                background: following.includes(s.id) ? "transparent" : `${TOKENS.primary}1f`,
                color: following.includes(s.id) ? t.textFaint : TOKENS.primary,
              }}>{following.includes(s.id) ? "Following" : "Follow"}</button>
            </GlassCard>
          ))}
        </div>

        <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="cm-display" style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Events</h3>
          <button onClick={() => setTab("explore")} style={{ background: "none", border: "none", color: TOKENS.primary, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, marginTop: 10 }}>
          {EVENTS.slice(0, 4).map((e) => <EventCard key={e.id} t={t} e={e} compact />)}
        </div>

        <div style={{ marginTop: 22, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="cm-display" style={{ fontSize: 16, fontWeight: 700 }}>Campus Communities</h3>
          <button onClick={() => setTab("explore")} style={{ background: "none", border: "none", color: TOKENS.primary, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>See all</button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20 }}>
          {CLUBS.slice(0, 4).map((c) => (
            <GlassCard key={c.id} t={t} style={{ padding: 14, minWidth: 170, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${TOKENS.primary}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <c.icon size={15} color={TOKENS.primary} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: t.text, marginTop: 8 }}>{c.name}</div>
              <Badge color={collegeColor(c.college)} style={{ marginTop: 6 }}>{c.college}</Badge>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DISCOVER (SWIPE)
   ============================================================ */

function SwipeCard({ t, student, onDecision, isTop, dragState, setDragState }) {
  const cardRef = useRef(null);
  const dragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleDown = (clientX, clientY) => {
    if (!isTop) return;
    dragging.current = true;
    startPos.current = { x: clientX, y: clientY };
  };
  const handleMove = (clientX, clientY) => {
    if (!dragging.current || !isTop) return;
    setDragState({ x: clientX - startPos.current.x, y: clientY - startPos.current.y });
  };
  const handleUp = () => {
    if (!isTop) return;
    dragging.current = false;
    const { x } = dragState;
    if (x > 110) onDecision("like");
    else if (x < -110) onDecision("pass");
    else if (dragState.y < -110) onDecision("super");
    else setDragState({ x: 0, y: 0 });
  };

  const rotate = isTop ? dragState.x / 18 : 0;
  const tx = isTop ? dragState.x : 0;
  const ty = isTop ? dragState.y * 0.4 : 0;
  const likeOpacity = isTop ? Math.min(1, Math.max(0, dragState.x / 100)) : 0;
  const passOpacity = isTop ? Math.min(1, Math.max(0, -dragState.x / 100)) : 0;
  const superOpacity = isTop ? Math.min(1, Math.max(0, -dragState.y / 100)) : 0;

  return (
    <div
      ref={cardRef}
      onMouseDown={(e) => handleDown(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleUp}
      onMouseLeave={() => dragging.current && handleUp()}
      onTouchStart={(e) => handleDown(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleUp}
      style={{
        position: "absolute", inset: 0, borderRadius: 26, overflow: "hidden", cursor: isTop ? "grab" : "default",
        transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`,
        transition: dragging.current ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)",
        border: `1px solid ${t.border}`, userSelect: "none", touchAction: "none",
        background: `linear-gradient(160deg, ${collegeColor(student.college)}33, ${t.bg2})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 150, height: 150, borderRadius: "50%",
          background: `linear-gradient(135deg, ${collegeColor(student.college)}, ${TOKENS.primary2})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, fontWeight: 700, color: "#fff", fontFamily: "Space Grotesk, sans-serif",
          boxShadow: "0 20px 50px -15px rgba(0,0,0,0.5)",
        }}>
          {student.name[0]}
        </div>
      </div>

      <div style={{ position: "absolute", top: 18, left: 18 }}>
        <div style={{ opacity: passOpacity, transform: `scale(${0.8 + passOpacity * 0.3}) rotate(-14deg)`, border: `3px solid ${TOKENS.like}`, color: TOKENS.like, fontWeight: 800, fontSize: 22, padding: "4px 14px", borderRadius: 10 }}>PASS</div>
      </div>
      <div style={{ position: "absolute", top: 18, right: 18 }}>
        <div style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeOpacity * 0.3}) rotate(14deg)`, border: `3px solid ${TOKENS.super}`, color: TOKENS.super, fontWeight: 800, fontSize: 22, padding: "4px 14px", borderRadius: 10 }}>LIKE</div>
      </div>
      <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}>
        <div style={{ opacity: superOpacity, transform: `scale(${0.8 + superOpacity * 0.3})`, border: `3px solid ${TOKENS.amber}`, color: TOKENS.amber, fontWeight: 800, fontSize: 20, padding: "4px 14px", borderRadius: 10 }}>SUPER ⭐</div>
      </div>

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 20px 20px",
        background: "linear-gradient(0deg, rgba(0,0,0,0.75), transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 21, fontFamily: "Space Grotesk, sans-serif" }}>{student.name}, {student.age}</span>
          <CheckCircle2 size={16} color={TOKENS.super} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 6 }}>{student.branch} • {student.year}</div>
        <Badge color={collegeColor(student.college)}>{student.college}</Badge>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{student.bio}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {student.interests.map((i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.18)", padding: "3px 9px", borderRadius: 999, backdropFilter: "blur(6px)" }}>{i}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Discover({ t, profile, onMatch, onServerMatch, authUser }) {
  const [filter, setFilter] = useState("All");
  const [liveCandidates, setLiveCandidates] = useState(null);
  const pool = useMemo(() => {
    if (authUser) return liveCandidates || [];
    return filter === "All" ? STUDENTS : STUDENTS.filter((s) => s.college === filter);
  }, [authUser, filter, liveCandidates]);
  const [index, setIndex] = useState(0);
  const [dragState, setDragState] = useState({ x: 0, y: 0 });
  const [flash, setFlash] = useState(null);

  useEffect(() => setIndex(0), [filter]);

  // Authenticated discovery is server-owned; demo candidates are guest-only.
  useEffect(() => {
    if (!authUser) return;
    cmApi.fetchDiscoverCandidates(filter === "All" ? undefined : filter)
      .then((list) => setLiveCandidates((list || []).map(adaptApiStudent)))
      .catch(() => setLiveCandidates([]));
  }, [authUser, filter]);

  const current = pool[index];
  const next = pool[index + 1];

  const decide = async (type) => {
    if (!current) return;
    setDragState({ x: type === "pass" ? -600 : type === "like" ? 600 : 0, y: type === "super" ? -700 : dragState.y });
    setFlash(type);

    if (authUser && liveCandidates) {
      // Real path: record the swipe with the backend and only show the
      // match animation if the server confirms it was mutual.
      const apiAction = type === "super" ? "super_like" : type === "like" ? "like" : "pass";
      try {
        const result = await cmApi.swipe(current.id, apiAction);
        if (result?.matched) onServerMatch(current);
      } catch (_) { /* best-effort — swiping still advances the deck locally */ }
    } else if (type !== "pass" && current.matchesBack) {
      // Demo/offline path: use the local matchesBack flag on seed data.
      onMatch(current);
    }

    setTimeout(() => {
      setIndex((i) => i + 1);
      setDragState({ x: 0, y: 0 });
      setFlash(null);
    }, 260);
  };

  const compat = (s) => {
    const shared = s.interests.filter((i) => profile.interests.includes(i)).length;
    const base = 46 + shared * 12 + (s.college === profile.college ? 8 : 0);
    return Math.min(97, base);
  };

  return (
    <div>
      <TopBar t={t} title="Discover" subtitle="Find friends, teammates & study partners across campus" />
      <div style={{ padding: "10px 24px" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
          <CollegePill code="All" active={filter === "All"} onClick={() => setFilter("All")} />
          {COLLEGES.map((c) => (
            <CollegePill key={c.code} code={c.code} active={filter === c.code} onClick={() => setFilter(c.code)} />
          ))}
        </div>

        <div style={{ position: "relative", height: 520, maxWidth: 380, margin: "0 auto" }}>
          {!current && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8, animation: "cmFadeUp .4s ease both" }}>
              <span style={{ fontSize: 40 }}>❤️</span>
              <div style={{ fontWeight: 700, fontSize: 16, color: t.text }}>No matches yet.</div>
              <div style={{ fontSize: 13, color: t.textMuted }}>Keep exploring your campus!</div>
              <GhostButton t={t} onClick={() => setIndex(0)} style={{ marginTop: 8 }}>Start over</GhostButton>
            </div>
          )}
          {next && <SwipeCard t={t} student={next} isTop={false} dragState={{ x: 0, y: 0 }} setDragState={() => {}} onDecision={() => {}} />}
          {current && (
            <SwipeCard t={t} student={current} isTop={true} dragState={dragState} setDragState={setDragState} onDecision={decide} />
          )}
        </div>

        {current && (
          <>
            <div style={{ maxWidth: 380, margin: "10px auto 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: t.textFaint, marginBottom: 4 }}>
                <span>Compatibility</span><span style={{ fontWeight: 700, color: t.text }}>{compat(current)}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: t.border, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${compat(current)}%`, background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.amber})`, transition: "width .5s ease" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 20 }}>
              <RoundBtn color={TOKENS.like} icon={X} onClick={() => decide("pass")} />
              <RoundBtn color={TOKENS.amber} icon={Star} onClick={() => decide("super")} size={46} />
              <RoundBtn color={TOKENS.super} icon={Heart} onClick={() => decide("like")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RoundBtn({ color, icon: Icon, onClick, size = 56 }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%", border: `2px solid ${color}`,
      background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color, transition: "transform .12s ease",
    }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.9)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <Icon size={size * 0.4} fill={Icon === Heart ? color : "none"} />
    </button>
  );
}

/* ============================================================
   MATCH MODAL
   ============================================================ */

function MatchModal({ t, student, profile, onClose, onChat }) {
  if (!student) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(6,6,14,0.78)", backdropFilter: "blur(10px)", animation: "cmFadeUp .3s ease both",
    }}>
      {[...Array(3)].map((_, i) => (
        <span key={i} style={{
          position: "absolute", width: 140, height: 140, borderRadius: "50%",
          border: `2px solid ${TOKENS.like}`, animation: `cmRing 2.4s ease-out ${i * 0.5}s infinite`,
        }} />
      ))}
      <div style={{ textAlign: "center", animation: "cmMatchPop .5s cubic-bezier(.2,1.4,.4,1) both", padding: 20 }}>
        <Sparkles size={26} color={TOKENS.amber} style={{ marginBottom: 6 }} />
        <h1 className="cm-display" style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: "0 0 14px", letterSpacing: -0.5 }}>
          YOU'RE CONNECTED!
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 }}>
          <Avatar name={profile.name || "You"} color={TOKENS.primary} />
          <Sparkles size={22} color={TOKENS.amber} />
          <Avatar name={student.name} color={collegeColor(student.college)} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginBottom: 26 }}>
          {(profile.name || "You").split(" ")[0]} & {student.name.split(" ")[0]} both said yes — time to say hi.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <PrimaryButton onClick={onChat} icon={MessageCircle}>Start Chat</PrimaryButton>
          <GhostButton t={{ ...t, text: "#fff", border: "rgba(255,255,255,0.3)" }} onClick={onClose}>Keep Exploring</GhostButton>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, color, size = 68, photoUrl }) {
  const [broken, setBroken] = useState(false);
  if (photoUrl && !broken) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setBroken(true)}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: "3px solid rgba(255,255,255,0.25)", background: color,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${TOKENS.primary2})`,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700,
      fontSize: size * 0.35, fontFamily: "Space Grotesk, sans-serif", border: "3px solid rgba(255,255,255,0.25)",
    }}>
      {name[0]}
    </div>
  );
}

/* ============================================================
   EXPLORE — students / clubs / events
   ============================================================ */

function EventCard({ t, e, compact }) {
  return (
    <GlassCard t={t} style={{ padding: 16, minWidth: compact ? 220 : "auto", flexShrink: 0 }}>
      <Badge color={collegeColor(e.college)}>{e.college}</Badge>
      <div style={{ fontWeight: 700, fontSize: 15, color: t.text, marginTop: 8 }}>{e.title}</div>
      <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span>📅 {e.date}</span><span>⏰ {e.time}</span>
      </div>
      <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 4 }}>{e.participants} participants (demo)</div>
    </GlassCard>
  );
}

function Explore({ t, profile, posts, following, onToggleFollow, onLike, onSave, onOpenComments,
                    reels, onLikeReel, onSaveReel, onOpenReelComments, onViewReel, authUser }) {
  const [tab, setTab] = useState("students");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const [postFilter, setPostFilter] = useState("For You");
  const [hashtagFocus, setHashtagFocus] = useState(null);

  // Authenticated tabs are server-owned; sample records are guest-only.
  const [livePosts, setLivePosts] = useState(null);
  const [liveReels, setLiveReels] = useState(null);
  const [liveStudents, setLiveStudents] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    if (tab === "posts") {
      setLoadingLive(true);
      cmApi.fetchFeed(postFilter === "For You" ? undefined : postFilter, 1)
        .then((data) => setLivePosts((data.posts || []).map(adaptApiPost)))
        .catch(() => setLivePosts([]))
        .finally(() => setLoadingLive(false));
    } else if (tab === "reels") {
      setLoadingLive(true);
      cmApi.fetchReels(filter === "All" ? undefined : filter, 1)
        .then((list) => setLiveReels((list || []).map(adaptApiReel)))
        .catch(() => setLiveReels([]))
        .finally(() => setLoadingLive(false));
    } else if (tab === "students") {
      setLoadingLive(true);
      cmApi.api.get("/users", { params: { college: filter === "All" ? undefined : filter, q: query || undefined } })
        .then((r) => setLiveStudents((r.data.users || []).map(adaptApiStudent)))
        .catch(() => setLiveStudents([]))
        .finally(() => setLoadingLive(false));
    }
  }, [authUser, tab, postFilter, filter, query]);

  const effectivePosts = authUser ? (livePosts || []) : posts;
  const effectiveReels = authUser ? (liveReels || []) : reels;
  const effectiveStudentsPool = authUser ? (liveStudents || []) : STUDENTS;

  const visiblePosts = useMemo(() => {
    let list = effectivePosts;
    if (!authUser) {
      if (postFilter === "Following") list = list.filter((p) => following.includes(p.authorId));
      else if (postFilter !== "For You") list = list.filter((p) => byId(p.authorId).college === postFilter);
    }
    if (hashtagFocus) list = list.filter((p) => p.hashtags.includes(hashtagFocus));
    return list;
  }, [authUser, effectivePosts, postFilter, following, hashtagFocus]);

  const studentList = useMemo(() => {
    let list = authUser ? effectiveStudentsPool : (filter === "All" ? STUDENTS : STUDENTS.filter((s) => s.college === filter));
    if (!authUser && q) list = list.filter((s) => s.name.toLowerCase().includes(q) || s.branch.toLowerCase().includes(q) || s.interests.some((i) => i.toLowerCase().includes(q)));
    return list;
  }, [authUser, filter, q, effectiveStudentsPool]);
  const clubList = useMemo(() => q ? CLUBS.filter((c) => c.name.toLowerCase().includes(q)) : CLUBS, [q]);
  const eventList = useMemo(() => q ? EVENTS.filter((e) => e.title.toLowerCase().includes(q)) : EVENTS, [q]);
  const hashtagHits = useMemo(() => q ? HASHTAGS.filter((h) => h.toLowerCase().includes(q)) : [], [q]);
  const list = studentList;

  const wrappedOnLike = (id) => {
    setLivePosts((lp) => lp ? lp.map((p) => p.id === id ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) } : p) : lp);
    onLike(id);
  };
  const wrappedOnSave = (id) => {
    setLivePosts((lp) => lp ? lp.map((p) => p.id === id ? { ...p, saved: !p.saved } : p) : lp);
    onSave(id);
  };
  const wrappedOnLikeReel = (id) => {
    setLiveReels((lr) => lr ? lr.map((r) => r.id === id ? { ...r, liked: !r.liked, likesCount: r.likesCount + (r.liked ? -1 : 1) } : r) : lr);
    onLikeReel(id);
  };
  const wrappedOnSaveReel = (id) => {
    setLiveReels((lr) => lr ? lr.map((r) => r.id === id ? { ...r, saved: !r.saved } : r) : lr);
    onSaveReel(id);
  };

  return (
    <div>
      <TopBar t={t} title="Explore" subtitle="Posts, reels, students, clubs & events across every college" />
      <div style={{ padding: "10px 24px" }}>
        {authUser && (livePosts || liveReels || liveStudents || loadingLive) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.textFaint, marginBottom: 8 }}>
            {loadingLive ? <Loader2 size={11} style={{ animation: "cmSpin 1s linear infinite" }} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: TOKENS.super }} />}
            {loadingLive ? "Loading from CampusMate..." : "Live data from your backend"}
          </div>
        )}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} color={t.textFaint} style={{ position: "absolute", left: 14, top: 12 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, clubs, events, hashtags..."
            style={{
              width: "100%", padding: "10px 14px 10px 38px", borderRadius: 12,
              border: `1.5px solid ${t.border}`, background: t.surface, color: t.text, fontSize: 13.5, outline: "none",
            }}
          />
        </div>
        {q && hashtagHits.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {hashtagHits.map((h) => <HashtagPill key={h} tag={h} t={t} onClick={() => {}} />)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
          {[
            { k: "students", label: "Students" },
            { k: "posts", label: "Posts" },
            { k: "reels", label: "Reels" },
            { k: "clubs", label: "Clubs" },
            { k: "events", label: "Events" },
          ].map((tb) => (
            <button key={tb.k} onClick={() => setTab(tb.k)} style={{
              padding: "8px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              border: `1.5px solid ${tab === tb.k ? TOKENS.primary : t.border}`,
              background: tab === tb.k ? `${TOKENS.primary}1f` : "transparent",
              color: tab === tb.k ? t.text : t.textMuted,
            }}>{tb.label}</button>
          ))}
        </div>

        {tab === "posts" && (
          <div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {FEED_FILTERS.map((f) => (
                <button key={f} onClick={() => { setPostFilter(f); setHashtagFocus(null); }} style={{
                  padding: "8px 15px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  border: `1.5px solid ${postFilter === f ? TOKENS.primary : t.border}`,
                  background: postFilter === f ? `${TOKENS.primary}1f` : "transparent",
                  color: postFilter === f ? t.text : t.textMuted, transition: "all .15s ease",
                }}>{f}</button>
              ))}
            </div>
            <TrendingHashtags t={t} onPick={(h) => setHashtagFocus(hashtagFocus === h ? null : h)} />
            {hashtagFocus && (
              <div style={{ marginTop: 10, marginBottom: 4, fontSize: 12, color: t.textMuted }}>
                Showing posts tagged <strong style={{ color: t.text }}>{hashtagFocus}</strong> ·{" "}
                <button onClick={() => setHashtagFocus(null)} style={{ background: "none", border: "none", color: TOKENS.primary, fontWeight: 700, cursor: "pointer" }}>clear</button>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              {visiblePosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: t.textMuted }}>
                  <div style={{ fontSize: 34, marginBottom: 6 }}>📸</div>
                  <div style={{ fontWeight: 700, color: t.text }}>No posts yet.</div>
                  <div style={{ fontSize: 12.5, marginTop: 3 }}>Be the first to share something with your campus.</div>
                </div>
              ) : visiblePosts.map((p) => (
                <PostCard key={p.id} t={t} post={p} following={following} onToggleFollow={onToggleFollow}
                  onLike={wrappedOnLike} onSave={wrappedOnSave} onOpenComments={onOpenComments} />
              ))}
            </div>
          </div>
        )}

        {tab === "reels" && (authUser ? <NativeReels t={t}/> :
          <ReelsFeed t={t} reels={effectiveReels} onLike={wrappedOnLikeReel} onSave={wrappedOnSaveReel}
            onOpenComments={onOpenReelComments} onView={onViewReel} />)}

        {tab === "students" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
              <CollegePill code="All" active={filter === "All"} onClick={() => setFilter("All")} />
              {COLLEGES.map((c) => <CollegePill key={c.code} code={c.code} active={filter === c.code} onClick={() => setFilter(c.code)} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
              {list.map((s) => (
                <GlassCard key={s.id} t={t} style={{ padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Avatar name={s.name} color={collegeColor(s.college)} size={44} photoUrl={s.photoUrl} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{s.name}</div>
                      <div style={{ fontSize: 11.5, color: t.textMuted }}>{s.branch} • {s.year}</div>
                    </div>
                  </div>
                  <Badge color={collegeColor(s.college)} style={{ marginTop: 10 }}>{s.college}</Badge>
                  <p style={{ fontSize: 12.5, color: t.textMuted, marginTop: 8, lineHeight: 1.5 }}>{s.bio}</p>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {tab === "clubs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))", gap: 14 }}>
            {clubList.map((c) => (
              <GlassCard key={c.id} t={t} style={{ padding: 18, transition: "transform .15s ease" }}
                onClick={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `${TOKENS.primary}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <c.icon size={18} color={TOKENS.primary} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: t.text }}>{c.name}</div>
                    <Badge color={collegeColor(c.college)}>{c.college}</Badge>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: t.textMuted, marginTop: 10, lineHeight: 1.5 }}>{c.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <span style={{ fontSize: 11.5, color: t.textFaint }}>{c.members} members</span>
                  <button style={{ fontSize: 12, fontWeight: 700, color: TOKENS.primary, background: "none", border: "none", cursor: "pointer" }}>Join →</button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {tab === "events" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))", gap: 14 }}>
              {eventList.map((e) => <EventCard key={e.id} t={t} e={e} />)}
            </div>
            <h3 className="cm-display" style={{ fontSize: 16, fontWeight: 700, marginTop: 28, marginBottom: 12 }}>Hackathon 2026 — schedule</h3>
            <GlassCard t={t} style={{ padding: 20 }}>
              {TIMELINE.map((tl, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: TOKENS.primary, animation: `cmPulseLine 2s ease-in-out ${i * 0.2}s infinite` }} />
                    {i < TIMELINE.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 30, background: t.border }} />}
                  </div>
                  <div style={{ paddingBottom: 18 }}>
                    <div style={{ fontSize: 12, color: t.textFaint }}>{tl.time}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{tl.label}</div>
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   REELS
   ============================================================ */

function ReelCard({ t, reel, active, liked, saved, onLike, onSave, onOpenComments, onView }) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const viewedRef = useRef(false);
  const a = byId(reel.authorId);

  useEffect(() => {
    if (active && !viewedRef.current) {
      const timer = setTimeout(() => { viewedRef.current = true; onView(reel.id); }, 2200); // "meaningful watch" threshold
      return () => clearTimeout(timer);
    }
  }, [active]);

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!liked) onLike(reel.id);
      setBurst(true);
      setTimeout(() => setBurst(false), 750);
    } else {
      setPlaying((p) => !p);
    }
    lastTap.current = now;
  };

  return (
    <div style={{
      position: "relative", height: "100%", width: "100%", scrollSnapAlign: "start",
      background: `linear-gradient(165deg, ${collegeColor(a.college)}55, #05060c 70%)`,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 20,
    }} onClick={tap}>
      <div style={{
        width: 92, height: 92, borderRadius: "50%", background: `linear-gradient(135deg, ${collegeColor(a.college)}, ${TOKENS.primary2})`,
        display: "flex", alignItems: "center", justifyContent: "center", opacity: playing ? 1 : 0.6, transition: "opacity .2s ease",
      }}>
        {!playing && <Play size={30} color="#fff" style={{ position: "absolute" }} />}
      </div>

      <div style={{ position: "absolute", top: 14, left: 14, right: 14, height: 3, background: "rgba(255,255,255,0.25)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: playing ? "100%" : "0%", background: "#fff", transition: playing ? "width 6s linear" : "none" }} />
      </div>

      <button onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }} style={{
        position: "absolute", top: 26, right: 14, background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%",
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer",
      }}>{muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>

      <div style={{ position: "absolute", left: 16, right: 76, bottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Avatar name={a.name} color={collegeColor(a.college)} size={34} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }}>{a.name}</span>
          <CheckCircle2 size={13} color={TOKENS.super} />
          <Badge color={collegeColor(a.college)}>{a.college}</Badge>
        </div>
        <p style={{ color: "#fff", fontSize: 13, margin: "0 0 6px", lineHeight: 1.4 }}>{reel.caption}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {reel.hashtags.map((h) => <span key={h} style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 700 }}>{h}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 11.5 }}>
          <Sparkles size={11} /> {reel.audio}
        </div>
      </div>

      <div style={{ position: "absolute", right: 12, bottom: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <button onClick={(e) => { e.stopPropagation(); onLike(reel.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: liked ? TOKENS.like : "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <Heart size={24} fill={liked ? TOKENS.like : "none"} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.likesCount.toLocaleString()}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onOpenComments(reel); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <MessageCircle size={22} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{reel.commentsCount}</span>
        </button>
        <button onClick={(e) => e.stopPropagation()} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <Repeat2 size={22} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>Share</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onSave(reel.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: saved ? TOKENS.amber : "#fff" }}>
          <Bookmark size={22} fill={saved ? TOKENS.amber : "none"} />
        </button>
      </div>

      <DoubleTapHeart show={burst} />
    </div>
  );
}

function ReelsFeed({ t, reels, onLike, onSave, onOpenComments, onView }) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index) setIndex(i);
  };

  return (
    <div>
      <div style={{ padding: "20px 24px 8px" }}>
        <h1 className="cm-display" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Reels</h1>
        <p style={{ fontSize: 12.5, color: t.textMuted, margin: "4px 0 0" }}>Vertical campus video — swipe up for more</p>
      </div>
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 16px 20px" }}>
        <div ref={containerRef} onScroll={onScroll} style={{
          width: "100%", maxWidth: 380, height: "72vh", overflowY: "auto", scrollSnapType: "y mandatory",
          borderRadius: 20, border: `1px solid ${t.border}`,
        }}>
          {reels.map((r, i) => (
            <div key={r.id} style={{ height: "100%", scrollSnapAlign: "start" }}>
              <ReelCard t={t} reel={r} active={i === index} liked={r.liked} saved={r.saved}
                onLike={onLike} onSave={onSave} onOpenComments={onOpenComments} onView={onView} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: t.textFaint, paddingBottom: 20 }}>
        <ChevronUp size={12} style={{ verticalAlign: "middle" }} /> swipe / scroll for the next reel <ChevronDown size={12} style={{ verticalAlign: "middle" }} />
      </div>
    </div>
  );
}

function ReelCommentsSheet({ t, reel, profile, onClose }) {
  if (!reel) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(6,6,14,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxWidth: 480, maxHeight: "60vh", background: t.bg2,
        borderRadius: "22px 22px 0 0", border: `1px solid ${t.border}`, borderBottom: "none",
        display: "flex", flexDirection: "column", animation: "cmSheetUp .3s cubic-bezier(.2,.9,.3,1) both", padding: 18,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="cm-display" style={{ fontWeight: 700, fontSize: 15, color: t.text }}>Comments · {reel.commentsCount}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><X size={18} /></button>
        </div>
        <div style={{ textAlign: "center", color: t.textFaint, fontSize: 12.5, padding: "20px 0" }}>Demo reel — comment thread not seeded yet. Be the first to comment.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Avatar name={profile.name || "You"} color={TOKENS.primary} size={32} />
          <input placeholder="Add a comment..." style={{ flex: 1, borderRadius: 999, border: `1.5px solid ${t.border}`, padding: "9px 14px", background: "transparent", color: t.text, fontSize: 13 }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MATCHES / CHAT
   ============================================================ */

function Chat({ t, student, profile, onBack }) {
  const [messages, setMessages] = useState([
    { from: "them", text: `Heyy! Excited we matched 🎉`, time: "10:02 AM" },
    { from: "me", text: `Same! Saw you're into ${student.interests[0]} too`, time: "10:03 AM" },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { from: "me", text: draft, time: "now" }]);
    setDraft("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: "them", text: "Haha totally, we should team up for the next hackathon!", time: "now" }]);
    }, 1400);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: t.text }}><ChevronLeft size={20} /></button>
        <Avatar name={student.name} color={collegeColor(student.college)} size={38} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: t.text }}>{student.name}</div>
          <div style={{ fontSize: 11.5, color: TOKENS.super }}>● Online</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "72%",
            animation: "cmPop .25s ease both",
          }}>
            <div style={{
              padding: "10px 14px", borderRadius: 16,
              borderBottomRightRadius: m.from === "me" ? 4 : 16,
              borderBottomLeftRadius: m.from === "me" ? 16 : 4,
              background: m.from === "me" ? `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primary2})` : t.surfaceStrong,
              color: m.from === "me" ? "#fff" : t.text, fontSize: 13.5, lineHeight: 1.5,
              border: m.from === "me" ? "none" : `1px solid ${t.border}`,
            }}>{m.text}</div>
            <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3, textAlign: m.from === "me" ? "right" : "left" }}>{m.time}</div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "10px 14px", borderRadius: 16, background: t.surfaceStrong, width: "fit-content", border: `1px solid ${t.border}` }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: t.textFaint, animation: `cmDot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${t.border}`, display: "flex", gap: 10 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          style={{
            flex: 1, borderRadius: 999, border: `1.5px solid ${t.border}`, padding: "11px 16px",
            background: "transparent", color: t.text, fontSize: 13.5, outline: "none",
          }}
        />
        <button onClick={send} style={{
          width: 42, height: 42, borderRadius: "50%", border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primary2})`, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Send size={16} /></button>
      </div>
    </div>
  );
}

function Matches({ t, matches, onOpenChat }) {
  return (
    <div>
      <TopBar t={t} title="Matches" subtitle={`${matches.length} mutual match${matches.length === 1 ? "" : "es"}`} />
      <div style={{ padding: "10px 24px" }}>
        {matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: t.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 700, color: t.text }}>Your conversations will appear here.</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Head to Discover to find your first match.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {matches.map((m) => (
              <button key={m.id} onClick={() => onOpenChat(m)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderRadius: 14,
                background: "transparent", border: "none", cursor: "pointer", textAlign: "left", width: "100%",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Avatar name={m.name} color={collegeColor(m.college)} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: t.text }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: t.textMuted }}>{m.college} • Say hi 👋</div>
                </div>
                <ChevronRight size={16} color={t.textFaint} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */

function ThumbGrid({ t, items, kind }) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "36px 0", color: t.textMuted }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>{kind === "reels" ? "🎬" : "📸"}</div>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 13.5 }}>No {kind} yet.</div>
        <div style={{ fontSize: 12, marginTop: 3 }}>{kind === "reels" ? "Create the first CampusMate reel!" : "Your posts will show up here."}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
      {items.map((p, i) => (
        <div key={p.id} style={{
          aspectRatio: kind === "reels" ? "9/16" : "1/1", borderRadius: 8, position: "relative", overflow: "hidden",
          background: `linear-gradient(150deg, ${collegeColor(byId(p.authorId).college)}66, ${TOKENS.primary2}44)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {kind === "reels" ? <Play size={16} color="rgba(255,255,255,0.8)" /> : <ImageIcon size={16} color="rgba(255,255,255,0.7)" />}
          <div style={{ position: "absolute", bottom: 4, left: 5, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
            <Heart size={9} fill="#fff" /> {(p.likesCount || 0) > 999 ? `${Math.round(p.likesCount / 100) / 10}K` : p.likesCount}
          </div>
        </div>
      ))}
    </div>
  );
}

function Profile({ t, profile, posts, reels, following, onBell, authUser, onPhotoUpdated }) {
  const fields = ["college", "branch", "year", "bio", "interests", "lookingFor"];
  const filled = fields.filter((f) => {
    const v = profile[f];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  const pct = Math.round((filled / fields.length) * 100);
  const [tab, setTab] = useState("posts");
  const myPosts = posts.filter((p) => p.authorId === 1); // demo: viewing as Rahul's linked seed account
  const myReels = reels.filter((r) => r.authorId === 1);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  const pickPhoto = () => fileInputRef.current?.click();
  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!authUser) { setToast("Log in to upload a real profile photo — this is local demo mode."); setTimeout(() => setToast(""), 3200); return; }
    setUploading(true);
    try {
      const data = await cmApi.uploadProfilePhoto(authUser._id, file);
      onPhotoUpdated?.(data.user.profilePhoto);
      setToast("Profile photo updated successfully ✨");
    } catch (err) {
      setToast(err.response?.data?.message || "Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setToast(""), 3200);
    }
  };

  return (
    <div>
      <TopBar t={t} title="My Profile" onBell={onBell} />
      <div style={{ padding: "10px 24px", maxWidth: 480 }}>
        {toast && (
          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 12, background: t.surfaceStrong, border: `1px solid ${t.border}`, fontSize: 12.5, color: t.text, animation: "cmPop .2s ease both" }}>
            {toast}
          </div>
        )}
        <GlassCard t={t} style={{ padding: 24, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <button onClick={pickPhoto} disabled={uploading} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: "50%" }}>
              <Avatar name={profile.name || "You"} color={TOKENS.primary} size={80} photoUrl={authUser?.profilePhoto?.url} />
              <div style={{
                position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%",
                background: TOKENS.primary, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${t.bg}`,
              }}>
                {uploading ? <Loader2 size={13} color="#fff" style={{ animation: "cmSpin 1s linear infinite" }} /> : <Camera size={13} color="#fff" />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="user" onChange={onFileChosen} style={{ display: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <span className="cm-display" style={{ fontWeight: 700, fontSize: 19, color: t.text }}>{profile.name || "Your Name"}</span>
            <CheckCircle2 size={17} color={TOKENS.super} />
          </div>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{profile.branch || "Branch"} • {profile.year || "Year"}</div>
          {profile.college && <Badge color={collegeColor(profile.college)} style={{ marginTop: 8 }}>✓ Verified {profile.college} Student</Badge>}
          {profile.bio && <p style={{ fontSize: 13.5, color: t.textMuted, marginTop: 14, lineHeight: 1.6 }}>{profile.bio}</p>}

          <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 16 }}>
            <div><div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{myPosts.length + myReels.length}</div><div style={{ fontSize: 11, color: t.textFaint }}>Posts</div></div>
            <div><div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{following.length}</div><div style={{ fontSize: 11, color: t.textFaint }}>Following</div></div>
            <div><div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>128</div><div style={{ fontSize: 11, color: t.textFaint }}>Followers</div></div>
          </div>

          {profile.interests.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
              {profile.interests.map((i) => <Badge key={i} color="rgba(128,120,200,0.55)">{i}</Badge>)}
            </div>
          )}
          {profile.lookingFor && (
            <div style={{ marginTop: 14, fontSize: 12.5, color: t.textFaint }}>Looking for <strong style={{ color: t.text }}>{profile.lookingFor}</strong></div>
          )}
        </GlassCard>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
            <span style={{ color: t.textMuted }}>Profile completed</span>
            <span style={{ fontWeight: 700, color: t.text }}>{pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: t.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.amber})`, transition: "width .6s ease" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginTop: 22, borderBottom: `1px solid ${t.border}` }}>
          {[
            { k: "posts", label: "Posts" },
            { k: "reels", label: "Reels" },
            { k: "tagged", label: "Tagged" },
            { k: "about", label: "About" },
          ].map((tb) => (
            <button key={tb.k} onClick={() => setTab(tb.k)} style={{
              flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
              fontSize: 12.5, fontWeight: 700, color: tab === tb.k ? t.text : t.textFaint,
              borderBottom: `2px solid ${tab === tb.k ? TOKENS.primary : "transparent"}`,
            }}>{tb.label}</button>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          {tab === "posts" && <ThumbGrid t={t} items={myPosts} kind="posts" />}
          {tab === "reels" && <ThumbGrid t={t} items={myReels} kind="reels" />}
          {tab === "tagged" && (
            <div style={{ textAlign: "center", padding: "36px 0", color: t.textMuted }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🏷️</div>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13.5 }}>No tagged posts yet.</div>
            </div>
          )}
          {tab === "about" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Edit Profile", "Privacy Settings", "Content You Saved", "Report a Problem", "Log Out"].map((label) => (
                <GlassCard key={label} t={t} style={{ padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: t.text }}>{label}</span>
                  <ChevronRight size={15} color={t.textFaint} />
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   COLLEGE PICKER — search-as-you-type against the real College
   collection, with a "can't find your college? add it" fallback.
   Used at signup and (when offline/demo) in onboarding.
   ============================================================ */

function CollegePicker({ t, value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", city: "", state: "" });
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      cmApi.searchColleges(query).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  const pick = (college) => {
    onChange({ id: college._id, name: college.name, city: college.city });
    setQuery(college.name);
    setOpen(false);
    setShowAdd(false);
  };

  const submitAdd = async () => {
    if (!addForm.name.trim()) return;
    setBusy(true);
    try {
      const college = await cmApi.addCollege(addForm);
      pick(college);
    } catch (err) {
      // offline/demo mode — no backend to add to; fall back to a local-only selection
      onChange({ id: null, name: addForm.name.trim(), city: addForm.city?.trim() });
      setQuery(addForm.name.trim());
      setOpen(false);
      setShowAdd(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(null); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search for your college"
        style={inputStyle(t)}
      />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20,
          background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden",
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.35)", maxHeight: 240, overflowY: "auto",
        }}>
          {!showAdd && results.map((c) => (
            <button key={c._id} onClick={() => pick(c)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
              background: "transparent", cursor: "pointer", color: t.text, fontSize: 13,
            }}>
              <div style={{ fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: t.textFaint }}>{[c.city, c.state].filter(Boolean).join(", ") || "Location not set"}</div>
            </button>
          ))}
          {!showAdd && (
            <button onClick={() => setShowAdd(true)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
              borderTop: results.length ? `1px solid ${t.border}` : "none",
              background: "transparent", cursor: "pointer", color: TOKENS.primary, fontSize: 12.5, fontWeight: 700,
            }}>
              Can't find your college? Add your college
            </button>
          )}
          {showAdd && (
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="College name" style={inputStyle(t)} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={addForm.city} onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="City" style={inputStyle(t)} />
                <input value={addForm.state} onChange={(e) => setAddForm((f) => ({ ...f, state: e.target.value }))}
                  placeholder="State" style={inputStyle(t)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <GhostButton t={t} onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "8px 0", justifyContent: "center" }}>Cancel</GhostButton>
                <PrimaryButton onClick={submitAdd} style={{ flex: 1, padding: "8px 0", justifyContent: "center" }}>
                  {busy ? "Adding..." : "Add college"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AUTH — real register/login against the backend, with a
   graceful offline fallback (backend not running / unreachable).
   ============================================================ */

function AuthScreen({ t, dark, setDark, onAuthed }) {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [college, setCollege] = useState(null); // { id, name, city }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(""); setOffline(false);
    if (mode === "register" && !college?.name) { setError("Please select or add your college."); return; }
    setLoading(true);
    try {
      const data = mode === "login"
        ? await cmApi.loginUser({ email: form.email, password: form.password })
        : await cmApi.registerUser({
            name: form.name, email: form.email, password: form.password,
            collegeId: college.id || undefined, collegeName: college.id ? undefined : college.name, collegeCity: college.city,
          });
      localStorage.setItem("cm_token", data.token);
      onAuthed(data.user);
    } catch (err) {
      if (!err.response) {
        // network/backend unreachable — this is expected if the backend isn't running
        setOffline(true);
      } else {
        setError(err.response.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, display: "flex", flexDirection: "column", alignItems: "center", padding: "26px 18px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo t={t} />
          <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 11, border: `1px solid ${t.border}`, background: t.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {dark ? <Sun size={15} color={t.text} /> : <Moon size={15} color={t.text} />}
          </button>
        </div>

        <GlassCard t={t} style={{ padding: 26, marginTop: 24 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 18, background: t.border, borderRadius: 12, padding: 3 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setOffline(false); }} style={{
                flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, background: mode === m ? t.bg2 : "transparent", color: mode === m ? t.text : t.textFaint,
              }}>{m === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "register" && (
              <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Full name"
                style={inputStyle(t)} />
            )}
            <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="College or personal email" type="email"
              style={inputStyle(t)} />
            <input value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Password" type="password"
              style={inputStyle(t)} />
            {mode === "register" && <CollegePicker t={t} value={college} onChange={setCollege} />}
          </div>
          {mode === "register" && (
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 6 }}>
              A personal email works just fine — a college email isn't required. Your college is just a profile detail.
            </div>
          )}

          {error && <div style={{ marginTop: 12, fontSize: 12.5, color: TOKENS.like }}>{error}</div>}
          {offline && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: t.textMuted, background: t.surface, padding: 10, borderRadius: 10 }}>
              <WifiOff size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>Can't reach the CampusMate backend right now. Start it with <code>cd backend && npm run dev</code>, or continue below with local demo data.</span>
            </div>
          )}

          <PrimaryButton onClick={submit} style={{ width: "100%", justifyContent: "center", marginTop: 16 }} icon={loading ? Loader2 : ArrowRight}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </PrimaryButton>
        </GlassCard>
      </div>
    </div>
  );
}

function inputStyle(t) {
  return {
    width: "100%", padding: "11px 14px", borderRadius: 11, border: `1.5px solid ${t.border}`,
    background: "transparent", color: t.text, fontSize: 13.5, outline: "none",
  };
}

/* ============================================================
   ROOT APP
   ============================================================ */

export default function CampusMateApp() {
  const { dark, setDark, t } = useTheme();
  const [view, setView] = useState("landing"); // landing | auth | onboarding | app
  const [tab, setTab] = useState("home");
  const [activeChat, setActiveChat] = useState(null);
  const [matchModal, setMatchModal] = useState(null);
  const [matches, setMatches] = useState([]);

  // ---- Session / backend connectivity ----
  const [authUser, setAuthUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [backendOnline, setBackendOnline] = useState(null); // null = unknown, true/false once checked

  useEffect(() => {
    const token = localStorage.getItem("cm_token");
    if (!token) { setCheckingSession(false); return; }
    cmApi.fetchMe()
      .then((user) => {
        setAuthUser(user);
        setPosts([]);
        setReels([]);
        setMatches([]);
        setBackendOnline(true);
        setProfile((p) => ({
          ...p, name: user.name, college: user.college, branch: user.branch || "",
          year: user.year || "", bio: user.bio || "", interests: user.interests || [],
          lookingFor: user.lookingFor || "",
        }));
        setView("app");
      })
      .catch((err) => {
        setBackendOnline(!!err.response); // reachable but token invalid vs unreachable entirely
        if (err.response) localStorage.removeItem("cm_token");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  // ---- Phase 2: social state ----
  const [posts, setPosts] = useState(POSTS.map((p) => ({ ...p, liked: false, saved: false })));
  const [reels, setReels] = useState(REELS.map((r) => ({ ...r, liked: false, saved: false })));
  const [following, setFollowing] = useState([1, 5]); // demo: already following two seed accounts
  const [activeStory, setActiveStory] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [commentsReel, setCommentsReel] = useState(null);

  const [profile, setProfile] = useState({
    name: "You",
    college: "",
    branch: "",
    year: "",
    bio: "",
    interests: [],
    lookingFor: "",
  });

  // Authenticated data never falls back to local sample records.
  useEffect(() => {
    if (view !== "app" || !authUser) return;
    setPosts([]);
    setReels([]);
    Promise.all([cmApi.fetchFeed("For You"), cmApi.fetchReels(), cmApi.fetchMatches()])
      .then(([feed, reelItems, matchItems]) => {
        setPosts((feed.posts || []).map(adaptApiPost));
        setReels((reelItems || []).map(adaptApiReel));
        setMatches(matchItems || []);
        setBackendOnline(true);
      })
      .catch(() => { setPosts([]); setReels([]); setMatches([]); setBackendOnline(false); });
  }, [view, authUser]);

  const handleMatch = (student) => {
    setMatches((m) => (m.find((x) => x.id === student.id) ? m : [student, ...m]));
    setMatchModal(student);
    if (authUser) cmApi.swipe(student.id, "like").catch(() => {});
  };

  const toggleFollow = (id) => {
    setFollowing((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
    if (authUser) {
      const isFollowing = following.includes(id);
      (isFollowing ? cmApi.unfollowUser(id) : cmApi.followUser(id)).catch(() => {});
    }
  };

  const likePost = (id) => {
    setPosts((ps) => ps.map((p) => p.id === id
      ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) } : p));
    if (authUser) cmApi.likePost(id).catch(() => {});
  };
  const savePost = (id) => {
    setPosts((ps) => ps.map((p) => p.id === id ? { ...p, saved: !p.saved } : p));
    if (authUser) cmApi.savePost(id).catch(() => {});
  };
  const addComment = (postId, text) => {
    setPosts((ps) => ps.map((p) => p.id === postId
      ? { ...p, commentsCount: p.commentsCount + 1, comments: [...p.comments, { id: `c${Date.now()}`, authorId: 1, text, time: "now" }] }
      : p));
    if (authUser) cmApi.addComment(postId, text).catch(() => {});
  };

  const likeReel = (id) => {
    setReels((rs) => rs.map((r) => r.id === id
      ? { ...r, liked: !r.liked, likesCount: r.likesCount + (r.liked ? -1 : 1) } : r));
    if (authUser) cmApi.likeReel(id).catch(() => {});
  };
  const saveReel = (id) => {
    setReels((rs) => rs.map((r) => r.id === id ? { ...r, saved: !r.saved } : r));
    if (authUser) cmApi.saveReel(id).catch(() => {});
  };
  const viewReel = (id) => {
    setReels((rs) => rs.map((r) => r.id === id ? { ...r, views: r.views + 1 } : r));
    if (authUser) cmApi.registerReelView(id).catch(() => {});
  };

  const publishPost = ({ type, caption }) => {
    setPosts((ps) => [{
      id: `p${Date.now()}`, authorId: 1, type, caption, hashtags: ["#CampusLife"],
      likesCount: 0, commentsCount: 0, savesCount: 0, createdAt: "just now", comments: [], liked: false, saved: false,
    }, ...ps]);
    // Real publishing requires multipart media upload (see cmApi.createPost) —
    // left as local-only for text-post demo content in this pass since the
    // Create sheet doesn't yet collect a real file for photo/reel modes.
  };

  if (checkingSession) {
    return (
      <div className="cm-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: t.bg }}>
        <GlobalStyle />
        <Loader2 size={22} color={t.textFaint} style={{ animation: "cmSpin 1s linear infinite" }} />
      </div>
    );
  }

  if (view === "landing") {
    return (
      <div className="cm-root">
        <GlobalStyle />
        <LandingPage t={t} dark={dark} setDark={setDark} onStart={() => setView(authUser ? "onboarding" : "auth")} />
      </div>
    );
  }

  if (view === "auth") {
    return (
      <div className="cm-root">
        <GlobalStyle />
        <AuthScreen
          t={t} dark={dark} setDark={setDark}
          onAuthed={(user) => {
            setAuthUser(user);
            setPosts([]);
            setReels([]);
            setMatches([]);
            setBackendOnline(true);
            setProfile((p) => ({
              ...p, name: user.name, college: user.college, branch: user.branch || "",
              year: user.year || "", bio: user.bio || "", interests: user.interests || [],
              lookingFor: user.lookingFor || "",
            }));
            setView("onboarding");
          }}
        />
      </div>
    );
  }

  if (view === "onboarding") {
    return (
      <div className="cm-root">
        <GlobalStyle />
        <Onboarding t={t} profile={profile} setProfile={setProfile} onFinish={() => {
          if (authUser) {
            cmApi.api.put(`/users/${authUser._id}`, {
              name: profile.name, bio: profile.bio, branch: profile.branch, year: profile.year,
              interests: profile.interests, lookingFor: profile.lookingFor,
            }).catch(() => {});
          }
          setView("app");
        }} />
      </div>
    );
  }

  const openStory = (story) => setActiveStory(story);

  return (
    <div className="cm-root">
      <GlobalStyle />
      <Shell t={t} dark={dark} setDark={setDark} tab={tab} setTab={setTab} unread={matches.length} onCreate={() => setShowCreate(true)}
        connectionStatus={!authUser ? "demo" : backendOnline ? "online" : "demo"}>
        {tab === "home" && (
          <Feed
            t={t} profile={profile} authUser={authUser} matches={matches} posts={posts} following={following}
            onToggleFollow={toggleFollow} onLike={likePost} onSave={savePost}
            onOpenComments={(p) => setCommentsPost(p)} onOpenStory={openStory}
            onBell={() => setShowNotifs((s) => !s)} setTab={setTab} onGoDiscover={() => setTab("discover")}
          />
        )}
        {tab === "discover" && <Discover t={t} profile={profile} authUser={authUser} onMatch={handleMatch} onServerMatch={handleMatch} />}
        {tab === "explore" && (
          <Explore t={t} profile={profile} posts={posts} following={following}
            onToggleFollow={toggleFollow} onLike={likePost} onSave={savePost} onOpenComments={(p) => setCommentsPost(p)}
            reels={reels} onLikeReel={likeReel} onSaveReel={saveReel} onOpenReelComments={(r) => setCommentsReel(r)} onViewReel={viewReel}
            authUser={authUser}
          />
        )}
        {tab === "messages" && <NativeMessages onClose={() => setTab("home")} />}
        {tab === "profile" && <NativeProfile me={authUser} onUserChange={(user) => { setAuthUser(user); setProfile(p => ({ ...p, ...user })); }} onLogout={() => { setAuthUser(null); setView("landing"); }} />}
      </Shell>

      <MatchModal
        t={t}
        student={matchModal}
        profile={profile}
        onClose={() => setMatchModal(null)}
        onChat={() => { setActiveChat(null); setTab("messages"); setMatchModal(null); }}
      />

      {activeStory && <StoryViewer t={t} story={activeStory} profile={profile} onClose={() => setActiveStory(null)} />}
      {showCreate && <CreateSheet t={t} onClose={() => setShowCreate(false)} onPublish={publishPost} />}
      {showNotifs && <NotificationsPanel t={t} onClose={() => setShowNotifs(false)} />}
      {commentsPost && (
        <CommentsSheet t={t} post={posts.find((p) => p.id === commentsPost.id) || commentsPost} profile={profile}
          onClose={() => setCommentsPost(null)} onAddComment={addComment} />
      )}
      {commentsReel && <ReelCommentsSheet t={t} reel={commentsReel} profile={profile} onClose={() => setCommentsReel(null)} />}
    </div>
  );
}
