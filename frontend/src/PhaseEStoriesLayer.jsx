import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { deleteStory, fetchMe, fetchStories, viewStory } from "./api/client";

function isHomeActive() {
  return Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.trim() === "Home" && (b.getAttribute("style") || "").includes("109, 93, 246"));
}

function expiryLabel(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${Math.max(1,m)}m left`;
}

function StoryViewer({ story, me, onClose, onPrev, onNext, onViewed, onDeleted }) {
  const videoRef = useRef(null);
  const [progress,setProgress] = useState(0);
  const [busy,setBusy] = useState(false);
  const own = String(story.author?._id || story.author) === String(me?._id);

  useEffect(() => {
    let cancelled = false;
    viewStory(story._id).then((r) => { if(!cancelled) onViewed(story._id, r.viewersCount); }).catch(() => {});
    setProgress(0);
    const started = Date.now();
    const duration = story.type === "video" ? 10000 : 6500;
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(tick); onNext(); }
    }, 80);
    return () => { cancelled=true; clearInterval(tick); };
  },[story._id]);

  const remove = async () => {
    if (!own || busy || !window.confirm("Delete this story?")) return;
    setBusy(true);
    try { await deleteStory(story._id); onDeleted(story._id); } finally { setBusy(false); }
  };

  return <div style={{position:"fixed",inset:0,zIndex:14000,background:"rgba(0,0,0,.92)",display:"grid",placeItems:"center",padding:12}}>
    <div style={{position:"relative",width:"min(100%,430px)",height:"min(86vh,760px)",borderRadius:22,overflow:"hidden",background:story.backgroundColor || "#111423",boxShadow:"0 30px 80px rgba(0,0,0,.45)"}}>
      <div style={{position:"absolute",top:10,left:10,right:10,zIndex:5,height:3,borderRadius:999,background:"rgba(255,255,255,.24)",overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",background:"white"}}/></div>
      {story.type === "video" ? <video ref={videoRef} src={story.mediaUrl} autoPlay playsInline muted={false} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : story.mediaUrl ? <img src={story.mediaUrl} alt="Story" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div style={{width:"100%",height:"100%",display:"grid",placeItems:"center",padding:30,color:"white",fontSize:28,fontWeight:800,textAlign:"center"}}>{story.textOverlay || "CampusMate Story"}</div>}
      <div style={{position:"absolute",inset:"0 0 auto",padding:"24px 14px 14px",display:"flex",alignItems:"center",gap:9,color:"white",background:"linear-gradient(rgba(0,0,0,.5),transparent)"}}>
        {story.author?.profilePhoto?.url ? <img src={story.author.profilePhoto.url} alt="" style={{width:34,height:34,borderRadius:"50%",objectFit:"cover"}}/> : <div style={{width:34,height:34,borderRadius:"50%",display:"grid",placeItems:"center",background:"#6D5DF6",fontWeight:800}}>{story.author?.name?.[0] || "U"}</div>}
        <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13.5}}>{story.author?.name || "CampusMate user"}</div><div style={{fontSize:10.5,opacity:.7}}>{expiryLabel(story.expiresAt)} · {story.viewersCount ?? story.viewedBy?.length ?? 0} views</div></div>
        {own && <button disabled={busy} onClick={remove} aria-label="Delete story" style={iconBtn}><Trash2 size={17}/></button>}
        <button onClick={onClose} aria-label="Close stories" style={iconBtn}><X size={18}/></button>
      </div>
      <button onClick={onPrev} aria-label="Previous story" style={{position:"absolute",left:0,top:70,bottom:0,width:"34%",border:"none",background:"transparent"}}/>
      <button onClick={onNext} aria-label="Next story" style={{position:"absolute",right:0,top:70,bottom:0,width:"34%",border:"none",background:"transparent"}}/>
      <button onClick={onPrev} style={{...iconBtn,position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}><ChevronLeft size={19}/></button>
      <button onClick={onNext} style={{...iconBtn,position:"absolute",right:10,top:"50%",transform:"translateY(-50%)"}}><ChevronRight size={19}/></button>
    </div>
  </div>;
}

const iconBtn={width:40,height:40,borderRadius:"50%",border:"1px solid rgba(255,255,255,.2)",background:"rgba(0,0,0,.38)",color:"white",display:"grid",placeItems:"center",cursor:"pointer",backdropFilter:"blur(8px)"};

export default function PhaseEStoriesLayer(){
  const [active,setActive]=useState(false); const [stories,setStories]=useState([]); const [me,setMe]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [index,setIndex]=useState(-1);
  useEffect(()=>{const detect=()=>setActive(isHomeActive());detect();const mo=new MutationObserver(detect);mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["style"]});return()=>mo.disconnect();},[]);
  const refresh=()=>{if(!localStorage.getItem("cm_token"))return;setLoading(true);setError("");Promise.all([fetchStories(),fetchMe()]).then(([s,u])=>{setStories((s||[]).filter(x=>!x.expiresAt||new Date(x.expiresAt)>new Date()));setMe(u);}).catch(e=>setError(e?.response?.data?.message||"Could not load stories.")).finally(()=>setLoading(false));};
  useEffect(()=>{if(active)refresh();},[active]);
  const grouped=useMemo(()=>{const map=new Map();stories.forEach(s=>{const id=String(s.author?._id||s.author||"unknown");if(!map.has(id))map.set(id,{author:s.author,items:[]});map.get(id).items.push(s);});return Array.from(map.values());},[stories]);
  const flat=useMemo(()=>grouped.flatMap(g=>g.items),[grouped]);
  const next=()=>setIndex(i=>i<0?-1:(i+1>=flat.length?-1:i+1)); const prev=()=>setIndex(i=>i<=0?-1:i-1);
  const markViewed=(id,count)=>setStories(prev=>prev.map(s=>s._id===id?{...s,viewersCount:count,viewedBy:[...(s.viewedBy||[]),me?._id].filter(Boolean)}:s));
  const remove=(id)=>{setStories(prev=>prev.filter(s=>s._id!==id));setIndex(-1);};
  if(!active||!localStorage.getItem("cm_token"))return null;
  return <>
    <div style={{position:"fixed",top:72,right:18,zIndex:45,width:"min(72vw,520px)",padding:"8px 10px",borderRadius:16,background:"rgba(15,19,38,.92)",border:"1px solid rgba(255,255,255,.1)",backdropFilter:"blur(14px)",boxShadow:"0 14px 36px rgba(0,0,0,.25)"}}>
      {loading?<div style={{height:54,display:"grid",placeItems:"center",color:"white"}}><Loader2 size={18} style={{animation:"cmSpin 1s linear infinite"}}/></div>:error?<button onClick={refresh} style={{width:"100%",minHeight:44,border:"none",borderRadius:10,background:"transparent",color:"#fb7185"}}>Retry stories</button>:grouped.length===0?<div style={{padding:11,color:"rgba(255,255,255,.62)",fontSize:12}}>No active stories yet.</div>:<div style={{display:"flex",gap:10,overflowX:"auto"}}>{grouped.map((g,gi)=>{const first=g.items[0];const seen=g.items.every(s=>(s.viewedBy||[]).some(v=>String(v._id||v)===String(me?._id)));return <button key={gi} onClick={()=>setIndex(flat.findIndex(s=>s._id===first._id))} style={{minWidth:64,border:"none",background:"transparent",color:"white",cursor:"pointer",padding:2}}><div style={{width:48,height:48,borderRadius:"50%",padding:2,margin:"0 auto",background:seen?"rgba(255,255,255,.24)":"linear-gradient(135deg,#6D5DF6,#F5A524)"}}><div style={{width:"100%",height:"100%",borderRadius:"50%",overflow:"hidden",background:"#15182a",display:"grid",placeItems:"center",fontWeight:800}}>{g.author?.profilePhoto?.url?<img src={g.author.profilePhoto.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(g.author?.name?.[0]||"U")}</div></div><div style={{fontSize:10.5,marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.author?.name?.split(" ")[0]||"Story"}</div></button>})}</div>}
    </div>
    {index>=0&&flat[index]&&<StoryViewer story={flat[index]} me={me} onClose={()=>setIndex(-1)} onNext={next} onPrev={prev} onViewed={markViewed} onDeleted={remove}/>} 
  </>;
}
