import React, { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, Loader2, MoreHorizontal, Play, Share2, Trash2, Volume2, VolumeX } from "lucide-react";
import { deleteReel, fetchMe, fetchReels, likeReel, registerReelView, saveReel } from "./api/client";

function ReelCard({ reel, me, onDelete }) {
  const videoRef = useRef(null);
  const viewTimer = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(reel.likesCount ?? reel.likes?.length ?? 0);
  const [views, setViews] = useState(reel.viewsCount ?? 0);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const own = String(reel.author?._id || reel.author) === String(me?._id);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= .7) {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        clearTimeout(viewTimer.current);
        viewTimer.current = setTimeout(() => registerReelView(reel._id).then((r) => setViews(r.viewsCount)).catch(() => {}), 2000);
      } else {
        video.pause(); setPlaying(false); clearTimeout(viewTimer.current);
      }
    }, { threshold: [.25, .7] });
    observer.observe(video);
    return () => { observer.disconnect(); clearTimeout(viewTimer.current); };
  }, [reel._id]);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) v.play().then(() => setPlaying(true)); else { v.pause(); setPlaying(false); } };
  const toggleLike = async () => { if (busy) return; setBusy(true); try { const r = await likeReel(reel._id); setLiked(r.liked); setLikes(r.likesCount); } finally { setBusy(false); } };
  const toggleSave = async () => { if (busy) return; setBusy(true); try { const r = await saveReel(reel._id); setSaved(r.saved); } finally { setBusy(false); } };
  const share = async () => { const payload = { title: "CampusMate Reel", text: reel.caption || "CampusMate Reel", url: window.location.href }; if (navigator.share) await navigator.share(payload).catch(() => {}); else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href).catch(() => {}); };
  const remove = async () => { if (!own || busy || !window.confirm("Delete this reel?")) return; setBusy(true); try { await deleteReel(reel._id); onDelete(reel._id); } finally { setBusy(false); } };

  return <article className="cm-phase-d-reel" style={{ position:"relative", width:"100%", maxWidth:520, margin:"0 auto 22px", minHeight:"min(72vh,720px)", borderRadius:22, overflow:"hidden", background:"#05060b", scrollSnapAlign:"start" }}>
    <video ref={videoRef} src={reel.videoUrl} poster={reel.thumbnailUrl || undefined} muted={muted} loop playsInline preload="metadata" onClick={togglePlay} style={{ width:"100%", height:"min(72vh,720px)", objectFit:"cover", display:"block", background:"#05060b" }} />
    {!playing && <button onClick={togglePlay} aria-label="Play reel" style={{ position:"absolute", inset:"50% auto auto 50%", transform:"translate(-50%,-50%)", width:62, height:62, borderRadius:"50%", border:"1px solid rgba(255,255,255,.3)", background:"rgba(0,0,0,.42)", color:"white", display:"grid", placeItems:"center" }}><Play size={27} fill="currentColor" /></button>}
    <div style={{ position:"absolute", inset:"auto 0 0", padding:"70px 18px 18px", color:"white", background:"linear-gradient(transparent,rgba(0,0,0,.82))" }}>
      <div style={{ fontWeight:800 }}>{reel.author?.name || "CampusMate user"}</div>
      {reel.caption && <div style={{ marginTop:6, fontSize:13, lineHeight:1.45, maxWidth:"80%" }}>{reel.caption}</div>}
      <div style={{ marginTop:7, fontSize:11.5, opacity:.72 }}>{views} views{reel.audioName ? ` · ${reel.audioName}` : ""}</div>
    </div>
    <div style={{ position:"absolute", right:12, bottom:18, display:"grid", gap:10 }}>
      <button onClick={toggleLike} disabled={busy} aria-label="Like reel" style={actionStyle}><Heart size={20} fill={liked ? "currentColor" : "none"}/><small>{likes}</small></button>
      <button onClick={toggleSave} disabled={busy} aria-label="Save reel" style={actionStyle}><Bookmark size={20} fill={saved ? "currentColor" : "none"}/></button>
      <button onClick={share} aria-label="Share reel" style={actionStyle}><Share2 size={20}/></button>
      <button onClick={() => { setMuted(v => !v); if (videoRef.current) videoRef.current.muted = !muted; }} aria-label="Toggle sound" style={actionStyle}>{muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
      {own && <button onClick={() => setMenu(v => !v)} aria-label="Reel actions" style={actionStyle}><MoreHorizontal size={20}/></button>}
    </div>
    {menu && own && <button onClick={remove} disabled={busy} style={{ position:"absolute", right:62, bottom:18, minHeight:44, padding:"0 14px", borderRadius:12, border:"1px solid rgba(255,255,255,.16)", background:"rgba(12,12,18,.94)", color:"#fb607f", fontWeight:800, display:"flex", alignItems:"center", gap:7 }}><Trash2 size={15}/> Delete reel</button>}
  </article>;
}

const actionStyle = { width:46, minHeight:46, borderRadius:"50%", border:"1px solid rgba(255,255,255,.18)", background:"rgba(0,0,0,.42)", color:"white", display:"grid", placeItems:"center", cursor:"pointer", backdropFilter:"blur(10px)" };

export default function PhaseDReelsLayer() {
  const [reels,setReels] = useState([]); const [me,setMe] = useState(null); const [loading,setLoading] = useState(false); const [error,setError] = useState(""); const [active,setActive] = useState(false);
  useEffect(() => {
    const detect = () => setActive(Array.from(document.querySelectorAll("button")).some(b => b.textContent?.trim() === "Reels" && (b.getAttribute("style") || "").includes("109, 93, 246")));
    detect(); const mo = new MutationObserver(detect); mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["style"]}); return () => mo.disconnect();
  },[]);
  useEffect(() => {
    if (!active || !localStorage.getItem("cm_token")) return; let dead=false; setLoading(true); setError("");
    Promise.all([fetchReels(), fetchMe()]).then(([rs,user]) => { if(!dead){setReels(rs || []);setMe(user);} }).catch(e => { if(!dead)setError(e?.response?.data?.message || "Could not load reels."); }).finally(() => { if(!dead)setLoading(false); });
    return () => { dead=true; };
  },[active]);
  if (!active || !localStorage.getItem("cm_token")) return null;
  return <div className="cm-phase-d-layer" style={{ position:"fixed", inset:"0 0 0 auto", zIndex:35, width:"min(100%,760px)", background:"#0A0D1A", overflowY:"auto", padding:"72px 18px 100px", scrollSnapType:"y proximity" }}>
    <button onClick={() => document.querySelectorAll("button").forEach(b => { if(b.textContent?.trim()==="Home") b.click(); })} style={{ position:"fixed", top:16, right:18, zIndex:40, minHeight:42, padding:"0 14px", borderRadius:12, border:"1px solid rgba(255,255,255,.12)", background:"rgba(15,19,38,.92)", color:"white", fontWeight:700 }}>Close reels</button>
    {loading && <div style={{minHeight:"55vh",display:"grid",placeItems:"center",color:"white"}}><Loader2 size={28} style={{animation:"cmSpin 1s linear infinite"}}/></div>}
    {error && <div style={{padding:24,textAlign:"center",color:"#fb7185"}}>{error}</div>}
    {!loading && !error && reels.length===0 && <div style={{padding:40,textAlign:"center",color:"rgba(255,255,255,.65)"}}>No reels yet. Upload the first campus reel.</div>}
    {reels.map(r => <ReelCard key={r._id} reel={r} me={me} onDelete={id => setReels(prev => prev.filter(x => x._id !== id))}/>)}
  </div>;
}
