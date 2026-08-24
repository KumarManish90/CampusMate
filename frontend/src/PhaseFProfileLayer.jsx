import React, { useEffect, useMemo, useState } from "react";
import { Bookmark, Film, Image as ImageIcon, Loader2, LogOut, Pencil, Shield, X } from "lucide-react";
import { fetchMe, fetchSavedContent, fetchUserPosts, fetchUserReels, updateUserProfile } from "./api/client";

function isProfileActive() {
  return Array.from(document.querySelectorAll("button")).some((b) => b.textContent?.trim() === "Profile" && (b.getAttribute("style") || "").includes("109, 93, 246"));
}

function findProfileContentTarget() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const tabs = buttons.filter((b) => ["Posts", "Reels", "Tagged", "About"].includes(b.textContent?.trim()));
  if (tabs.length < 4) return null;
  const row = tabs[0].parentElement;
  return row?.nextElementSibling || null;
}

function CardGrid({ items, kind }) {
  if (!items.length) return <div style={{ padding: 34, textAlign: "center", color: "rgba(242,241,251,.58)" }}>{kind === "reels" ? "No reels yet." : "No posts yet."}</div>;
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
    {items.map((item) => {
      const media = kind === "reels" ? item.thumbnailUrl || item.videoUrl : item.media?.[0]?.url;
      return <div key={item._id} style={{ aspectRatio: kind === "reels" ? "9/16" : "1/1", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.06)", position: "relative", display: "grid", placeItems: "center" }}>
        {media ? <img src={media} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : kind === "reels" ? <Film size={20} /> : <ImageIcon size={20} />}
      </div>;
    })}
  </div>;
}

function Modal({ title, onClose, children }) {
  return <div style={{ position:"fixed", inset:0, zIndex:15000, background:"rgba(0,0,0,.68)", display:"grid", placeItems:"center", padding:16 }}>
    <div style={{ width:"min(100%,460px)", maxHeight:"88vh", overflowY:"auto", borderRadius:20, background:"#111526", border:"1px solid rgba(255,255,255,.12)", color:"#f4f2ff", padding:18 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}><strong>{title}</strong><button onClick={onClose} style={iconBtn}><X size={17}/></button></div>{children}
    </div>
  </div>;
}

const inputStyle={width:"100%",borderRadius:12,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.04)",color:"#f4f2ff",padding:"10px 12px",fontSize:13};
const iconBtn={width:38,height:38,borderRadius:11,border:"1px solid rgba(255,255,255,.12)",background:"transparent",color:"#fff",display:"grid",placeItems:"center"};

export default function PhaseFProfileLayer() {
  const [active,setActive]=useState(false); const [target,setTarget]=useState(null); const [tab,setTab]=useState("posts");
  const [me,setMe]=useState(null); const [posts,setPosts]=useState([]); const [reels,setReels]=useState([]); const [saved,setSaved]=useState({posts:[],reels:[]});
  const [loading,setLoading]=useState(false); const [modal,setModal]=useState(null); const [form,setForm]=useState({name:"",bio:"",branch:"",year:"",lookingFor:"",interests:""}); const [privacy,setPrivacy]=useState("campus");

  const load = async () => {
    if (!localStorage.getItem("cm_token")) return;
    setLoading(true);
    try {
      const user=await fetchMe(); setMe(user);
      const [p,r,s]=await Promise.all([fetchUserPosts(user._id),fetchUserReels(user._id),fetchSavedContent(user._id)]);
      setPosts(p||[]); setReels(r||[]); setSaved(s||{posts:[],reels:[]}); setPrivacy(user.privacy || "campus");
      setForm({name:user.name||"",bio:user.bio||"",branch:user.branch||"",year:user.year||"",lookingFor:user.lookingFor||"",interests:(user.interests||[]).join(", ")});
    } finally { setLoading(false); }
  };

  useEffect(()=>{const sync=()=>{setActive(isProfileActive());setTarget(findProfileContentTarget());};sync();const mo=new MutationObserver(sync);mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["style"]});return()=>mo.disconnect();},[]);
  useEffect(()=>{if(active)load();},[active]);
  useEffect(()=>{if(!active)return;const handler=(e)=>{const b=e.target instanceof Element?e.target.closest("button"):null;if(!b)return;const label=b.textContent?.trim();if(["Posts","Reels","Tagged","About"].includes(label)){setTab(label.toLowerCase());}};document.addEventListener("click",handler,true);return()=>document.removeEventListener("click",handler,true);},[active]);

  useEffect(()=>{
    if(!target)return;
    const old=target.style.display; target.style.display="none";
    let host=target.parentElement?.querySelector(":scope > [data-cm-profile-live]");
    if(!host){host=document.createElement("div");host.dataset.cmProfileLive="1";target.parentElement?.appendChild(host);} setPortalHost(host);
    return()=>{target.style.display=old;host?.remove();};
  },[target]);

  const [portalHost,setPortalHost]=useState(null);
  const saveProfile=async()=>{if(!me)return;const user=await updateUserProfile(me._id,{name:form.name,bio:form.bio,branch:form.branch,year:form.year,lookingFor:form.lookingFor,interests:form.interests.split(",").map(x=>x.trim()).filter(Boolean)});setMe(user);setModal(null);window.location.reload();};
  const savePrivacy=async()=>{if(!me)return;await updateUserProfile(me._id,{privacy});setModal(null);};
  const logout=()=>{localStorage.removeItem("cm_token");window.location.reload();};

  const body=useMemo(()=>{
    if(loading)return <div style={{padding:36,display:"grid",placeItems:"center"}}><Loader2 size={22} style={{animation:"cmSpin 1s linear infinite"}}/></div>;
    if(tab==="posts")return <CardGrid items={posts} kind="posts"/>;
    if(tab==="reels")return <CardGrid items={reels} kind="reels"/>;
    if(tab==="tagged")return <div style={{padding:34,textAlign:"center",color:"rgba(242,241,251,.58)"}}>No tagged posts yet.</div>;
    return <div style={{display:"grid",gap:9}}>
      <button onClick={()=>setModal("edit")} style={rowBtn}><Pencil size={16}/>Edit Profile</button>
      <button onClick={()=>setModal("privacy")} style={rowBtn}><Shield size={16}/>Privacy Settings</button>
      <button onClick={()=>setModal("saved")} style={rowBtn}><Bookmark size={16}/>Content You Saved <span style={{marginLeft:"auto",opacity:.6}}>{(saved.posts?.length||0)+(saved.reels?.length||0)}</span></button>
      <button onClick={logout} style={{...rowBtn,color:"#fb7185"}}><LogOut size={16}/>Log Out</button>
    </div>;
  },[loading,tab,posts,reels,saved]);

  if(!active||!portalHost)return null;
  return <>{ReactDOM.createPortal(<div style={{marginTop:14}}>{body}</div>,portalHost)}
    {modal==="edit"&&<Modal title="Edit Profile" onClose={()=>setModal(null)}><div style={{display:"grid",gap:10}}><input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Name"/><textarea style={{...inputStyle,minHeight:90}} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Bio"/><input style={inputStyle} value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))} placeholder="Branch"/><input style={inputStyle} value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} placeholder="Year"/><input style={inputStyle} value={form.lookingFor} onChange={e=>setForm(f=>({...f,lookingFor:e.target.value}))} placeholder="Looking for"/><input style={inputStyle} value={form.interests} onChange={e=>setForm(f=>({...f,interests:e.target.value}))} placeholder="Interests, comma separated"/><button onClick={saveProfile} style={primaryBtn}>Save profile</button></div></Modal>}
    {modal==="privacy"&&<Modal title="Privacy Settings" onClose={()=>setModal(null)}><select style={inputStyle} value={privacy} onChange={e=>setPrivacy(e.target.value)}><option value="campus">Campus only</option><option value="public">Public</option><option value="private">Private</option></select><button onClick={savePrivacy} style={{...primaryBtn,marginTop:12}}>Save privacy</button></Modal>}
    {modal==="saved"&&<Modal title="Saved Content" onClose={()=>setModal(null)}><div style={{fontSize:12,opacity:.65,marginBottom:10}}>Saved posts</div><CardGrid items={saved.posts||[]} kind="posts"/><div style={{fontSize:12,opacity:.65,margin:"16px 0 10px"}}>Saved reels</div><CardGrid items={saved.reels||[]} kind="reels"/></Modal>}
  </>;
}

const rowBtn={width:"100%",minHeight:50,borderRadius:14,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.035)",color:"#f4f2ff",display:"flex",alignItems:"center",gap:10,padding:"0 14px",fontWeight:700,cursor:"pointer"};
const primaryBtn={minHeight:44,border:"none",borderRadius:12,background:"linear-gradient(135deg,#6D5DF6,#A855F7)",color:"white",fontWeight:800,padding:"0 16px",cursor:"pointer"};
