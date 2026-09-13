import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Film, Heart, Image as ImageIcon, Loader2, LogOut, Paperclip, Pencil, Play, RefreshCw, Send, Shield, Smile, Trash2, Volume2, VolumeX, X } from "lucide-react";
import * as api from "./api/client";
import { disconnectChatSocket, getChatSocket } from "./api/chatSocket";
import { showToast } from "./utils/toast.js";

const panel = { border: "1px solid rgba(128,128,160,.2)", borderRadius: 16, background: "rgba(128,128,160,.06)" };
const button = { minHeight: 44, border: "1px solid rgba(128,128,160,.25)", borderRadius: 12, background: "rgba(128,128,160,.09)", color: "inherit", padding: "0 14px", cursor: "pointer" };
const field = { width: "100%", minHeight: 44, border: "1px solid rgba(128,128,160,.25)", borderRadius: 12, background: "transparent", color: "inherit", padding: "10px 12px", fontSize: 16 };
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong.";

function Avatar({ user, size = 42 }) {
  const url = api.resolveMediaUrl(user?.profilePhoto?.url);
  return url ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ width: size, height: size, borderRadius: "50%", display: "grid", placeItems: "center", background: "#6D5DF6", color: "white", fontWeight: 800 }}>{user?.name?.[0] || "U"}</span>;
}

export function NativeStories({ me }) {
  const [stories, setStories] = useState([]), [index, setIndex] = useState(-1), [creating, setCreating] = useState(false), [error, setError] = useState("");
  const refresh = async () => { try { const data = await api.fetchStories(); setStories((Array.isArray(data) ? data : []).filter(s => !s.expiresAt || new Date(s.expiresAt) > new Date())); setError(""); } catch (e) { setStories([]); setError(errorText(e)); } };
  useEffect(() => { if (!me) return; refresh(); const fn = () => refresh(); window.addEventListener("cm-media-uploaded", fn); return () => window.removeEventListener("cm-media-uploaded", fn); }, [me?._id]);
  const groups = useMemo(() => { const map = new Map(); stories.forEach(s => { const id = String(s.author?._id || s.author); if (!map.has(id)) map.set(id, { author: s.author, items: [] }); map.get(id).items.push(s); }); return [...map.values()]; }, [stories]);
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);
  const mineIndex = flat.findIndex(s => String(s.author?._id || s.author) === String(me?._id));
  return <>
    <div className="cm-story-strip" aria-label="Stories">
      <button className="cm-story-button" onClick={() => mineIndex >= 0 ? setIndex(mineIndex) : setCreating(true)}>
        <span className={`cm-own-story-avatar ${mineIndex >= 0 ? "has-story" : ""}`}><Avatar user={me} size={52}/>{mineIndex < 0 && <i aria-hidden="true">+</i>}</span>
        <span>{mineIndex >= 0 ? "Your story" : "Add story"}</span>
      </button>
      {groups.filter(g => String(g.author?._id || g.author) !== String(me?._id)).map(g => <button key={g.author?._id || g.author} className="cm-story-button" onClick={() => setIndex(flat.indexOf(g.items[0]))}><Avatar user={g.author} size={52}/><span>{g.author?.name?.split(" ")[0] || "Story"}</span></button>)}
    </div>
    {error && <div className="cm-inline-error">{error} <button onClick={refresh}>Retry</button></div>}
    {creating && <StoryComposer onClose={() => setCreating(false)} onCreated={story => { setStories(s => [story, ...s]); setCreating(false); }}/>} 
    {index >= 0 && flat[index] && <NativeStoryViewer story={flat[index]} me={me} onClose={() => setIndex(-1)} onNext={() => setIndex(i => i + 1 < flat.length ? i + 1 : -1)} onPrev={() => setIndex(i => i > 0 ? i - 1 : -1)} onDeleted={id => { setStories(s => s.filter(x => x._id !== id)); setIndex(-1); }} />}
  </>;
}

function StoryComposer({ onClose, onCreated }) {
  const [type, setType] = useState("text"), [text, setText] = useState(""), [file, setFile] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submit = async e => { e.preventDefault(); if (type !== "text" && !file) return setError("Choose an image or video."); const form = new FormData(); form.append("type", type); form.append("textOverlay", text); form.append("backgroundColor", "#6D5DF6"); if (file) form.append("media", file); setBusy(true); try { onCreated(await api.createStory(form)); showToast("Story published successfully."); } catch (err) { const message = errorText(err); setError(message); showToast(message, "error"); setBusy(false); } };
  return <div className="cm-native-modal"><form className="cm-media-composer" onSubmit={submit}><header><strong>Create story</strong><button type="button" onClick={onClose}><X/></button></header><select style={field} value={type} onChange={e => { setType(e.target.value); setFile(null); }}><option value="text">Text</option><option value="image">Image</option><option value="video">Video</option></select><textarea style={field} value={text} maxLength={300} onChange={e => setText(e.target.value)} placeholder="Story text"/>{type !== "text" && <input style={field} type="file" accept={type === "video" ? "video/*" : "image/*"} onChange={e => setFile(e.target.files?.[0] || null)}/>} {error && <div className="cm-inline-error">{error}</div>}<button style={button} disabled={busy}>{busy ? "Publishing…" : "Publish story"}</button></form></div>;
}

function NativeStoryViewer({ story, me, onClose, onNext, onPrev, onDeleted }) {
  const [progress, setProgress] = useState(0), own = String(story.author?._id || story.author) === String(me?._id);
  useEffect(() => { api.viewStory(story._id).catch(() => {}); const started = Date.now(), duration = story.type === "video" ? 10000 : 6500; const timer = setInterval(() => { const p = Math.min(100, (Date.now() - started) / duration * 100); setProgress(p); if (p === 100) { clearInterval(timer); onNext(); } }, 80); return () => clearInterval(timer); }, [story._id]);
  const remove = async () => { if (own && window.confirm("Delete this story?")) { await api.deleteStory(story._id); onDeleted(story._id); } };
  const mediaUrl = api.resolveMediaUrl(story.mediaUrl);
  return <div className="cm-native-modal cm-story-viewer"><div className="cm-story-stage" style={{ background: story.backgroundColor || "#111423" }}><div className="cm-story-progress"><i style={{ width: `${progress}%` }}/></div><header><Avatar user={story.author} size={34}/><strong>{story.author?.name || "CampusMate user"}</strong>{own && <button onClick={remove} aria-label="Delete story"><Trash2 size={18}/></button>}<button onClick={onClose} aria-label="Close"><X size={19}/></button></header>{story.type === "video" ? <video src={mediaUrl} autoPlay playsInline /> : mediaUrl ? <img src={mediaUrl} alt="Story"/> : <div className="cm-story-text">{story.textOverlay}</div>}<button className="cm-story-prev" onClick={onPrev} aria-label="Previous story"><ChevronLeft/></button><button className="cm-story-next" onClick={onNext} aria-label="Next story"><ChevronRight/></button></div></div>;
}

export function NativeReels({ t }) {
  const [reels, setReels] = useState([]), [me, setMe] = useState(null), [loading, setLoading] = useState(true), [creating, setCreating] = useState(false), [error, setError] = useState("");
  const load = async () => { setLoading(true); try { const [items, user] = await Promise.all([api.fetchReels(), api.fetchMe()]); setReels(Array.isArray(items) ? items : []); setMe(user || null); setError(""); } catch (e) { setReels([]); setError(errorText(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); const fn = () => load(); window.addEventListener("cm-media-uploaded", fn); return () => window.removeEventListener("cm-media-uploaded", fn); }, []);
  if (loading) return <FeatureLoading/>;
  return <section className="cm-native-reels"><div className="cm-feature-toolbar"><h2>Reels</h2><button onClick={() => setCreating(true)} style={button}>+ Upload</button><button onClick={load} style={button}><RefreshCw size={16}/> Refresh</button></div>{error && <div className="cm-inline-error">{error}</div>}{!reels.length && !error && <div className="cm-empty">No reels yet.</div>}{reels.map(r => <NativeReel key={r._id} reel={r} me={me} onDelete={id => setReels(x => x.filter(r => r._id !== id))}/>)}{creating && <ReelComposer onClose={() => setCreating(false)} onCreated={reel => { setReels(items => [reel, ...items]); setCreating(false); }}/>}</section>;
}

function ReelComposer({ onClose, onCreated }) {
  const [video, setVideo] = useState(null), [caption, setCaption] = useState(""), [hashtags, setHashtags] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submit = async e => { e.preventDefault(); if (!video) return setError("Choose a video."); const form = new FormData(); form.append("video", video); form.append("caption", caption); form.append("hashtags", hashtags); setBusy(true); try { onCreated(await api.createReel(form)); showToast("Reel published successfully."); } catch (err) { const message = errorText(err); setError(message); showToast(message, "error"); setBusy(false); } };
  return <div className="cm-native-modal"><form className="cm-media-composer" onSubmit={submit}><header><strong>Upload reel</strong><button type="button" onClick={onClose}><X/></button></header><input style={field} type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)}/><textarea style={field} value={caption} maxLength={300} onChange={e => setCaption(e.target.value)} placeholder="Caption"/><input style={field} value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="hashtags, comma separated"/>{error && <div className="cm-inline-error">{error}</div>}<button style={button} disabled={busy}>{busy ? "Uploading…" : "Publish reel"}</button></form></div>;
}

function NativeReel({ reel, me, onDelete }) {
  const ref = useRef(null), timer = useRef(); const meId = String(me?._id || "");
  const [muted, setMuted] = useState(true), [playing, setPlaying] = useState(false), [liked, setLiked] = useState((reel.likes || []).some(x => String(x) === meId)), [saved, setSaved] = useState((reel.savedBy || []).some(x => String(x) === meId)), [likes, setLikes] = useState(reel.likesCount ?? reel.likes?.length ?? 0), [views, setViews] = useState(reel.viewsCount || 0);
  useEffect(() => { const video = ref.current; if (!video) return; const observer = new IntersectionObserver(([e]) => { if (e.intersectionRatio >= .7) { video.play().then(() => setPlaying(true)).catch(() => {}); timer.current = setTimeout(() => api.registerReelView(reel._id).then(r => setViews(r.viewsCount)), 2000); } else { video.pause(); setPlaying(false); clearTimeout(timer.current); } }, { threshold: [.25, .7] }); observer.observe(video); return () => { observer.disconnect(); clearTimeout(timer.current); }; }, [reel._id]);
  return <article className="cm-native-reel"><video ref={ref} src={api.resolveMediaUrl(reel.videoUrl)} poster={api.resolveMediaUrl(reel.thumbnailUrl)} muted={muted} loop playsInline preload="metadata" onClick={() => { if (ref.current.paused) ref.current.play(); else ref.current.pause(); }}/>{!playing && <Play className="cm-reel-play"/>}<div className="cm-reel-caption"><strong>{reel.author?.name || "CampusMate user"}</strong><span>{reel.caption}</span><small>{views} views</small></div><div className="cm-reel-actions"><button onClick={() => api.likeReel(reel._id).then(r => { setLiked(r.liked); setLikes(r.likesCount); })}><Heart fill={liked ? "currentColor" : "none"}/><small>{likes}</small></button><button onClick={() => api.saveReel(reel._id).then(r => setSaved(r.saved))}><Bookmark fill={saved ? "currentColor" : "none"}/></button><button onClick={() => { setMuted(v => !v); ref.current.muted = !muted; }}>{muted ? <VolumeX/> : <Volume2/>}</button>{String(reel.author?._id || reel.author) === meId && <button onClick={() => api.deleteReel(reel._id).then(() => onDelete(reel._id))}><Trash2/></button>}</div></article>;
}

const CHAT_EMOJIS = ["😀", "😂", "🥰", "😎", "🤝", "👍", "❤️", "🔥", "🎉", "🙌", "📚", "🚀"];
const lastSeenText = value => {
  if (!value) return "Offline";
  const date = new Date(value), minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (Number.isNaN(date.getTime())) return "Offline";
  if (minutes < 1) return "Offline just now";
  if (minutes < 60) return `Offline ${minutes}m ago`;
  if (minutes < 1440) return `Offline ${Math.floor(minutes / 60)}h ago`;
  return `Last seen ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

export function NativeMessages({ onClose }) {
  const [me, setMe] = useState(null), [matches, setMatches] = useState([]), [selected, setSelected] = useState(null), [messages, setMessages] = useState([]), [text, setText] = useState(""), [file, setFile] = useState(null), [showEmoji, setShowEmoji] = useState(false), [onlineIds, setOnlineIds] = useState(() => new Set()), [sending, setSending] = useState(false), [error, setError] = useState(""), end = useRef(null), fileInput = useRef(null);
  const load = async () => { try { const [user, data] = await Promise.all([api.fetchMe(), api.fetchMatches()]); const list = Array.isArray(data) ? data : []; setMe(user || null); setMatches(list); setSelected(s => s || list[0] || null); setError(""); } catch (e) { setMatches([]); setError(errorText(e)); } };
  useEffect(() => {
    load();
    const socket = getChatSocket();
    if (!socket) return undefined;
    const snapshot = ({ userIds = [] }) => setOnlineIds(new Set((Array.isArray(userIds) ? userIds : []).map(String)));
    const presence = ({ userId, online }) => setOnlineIds(previous => { const next = new Set(previous); if (online) next.add(String(userId)); else next.delete(String(userId)); return next; });
    socket.on("presence:snapshot", snapshot); socket.on("presence:update", presence);
    return () => { socket.off("presence:snapshot", snapshot); socket.off("presence:update", presence); };
  }, []);
  useEffect(() => { if (!selected?._id) return; api.fetchMessages(selected._id).then(data => setMessages(Array.isArray(data) ? data : [])).catch(e => { setMessages([]); setError(errorText(e)); }); const socket = getChatSocket(); if (!socket) return; socket.emit("chat:join", selected._id); socket.emit("chat:read", { matchId: selected._id }); const incoming = m => { if (m && String(m.match) === String(selected._id)) setMessages(p => p.some(x => x._id === m._id) ? p : [...p, m]); }; socket.on("chat:message", incoming); return () => { socket.emit("chat:leave", selected._id); socket.off("chat:message", incoming); }; }, [selected?._id]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);
  const chooseFile = event => { const picked = event.target.files?.[0] || null; if (picked && picked.size > 100 * 1024 * 1024) setError("Media must be smaller than 100 MB."); else { setFile(picked); setError(""); } };
  const send = async e => { e.preventDefault(); const value = text.trim(); if ((!value && !file) || !selected || sending) return; setSending(true); setError(""); try { const msg = await api.sendMessage(selected._id, value, file); setMessages(p => p.some(x => x._id === msg._id) ? p : [...p, msg]); setText(""); setFile(null); setShowEmoji(false); if (fileInput.current) fileInput.current.value = ""; } catch (err) { setError(errorText(err)); } finally { setSending(false); } };
  const peerOnline = selected?.user?._id && onlineIds.has(String(selected.user._id));
  return <section className={`cm-native-chat ${selected ? "has-selection" : ""}`}><aside><div className="cm-feature-toolbar"><h2>Messages</h2><button onClick={load} style={button}><RefreshCw size={16}/></button><button onClick={onClose} style={button}><X size={17}/></button></div>{matches.map(m => <button className={selected?._id === m._id ? "active" : ""} key={m._id} onClick={() => setSelected(m)}><Avatar user={m.user}/><span><strong>{m.user?.name || "CampusMate user"}</strong><small>{onlineIds.has(String(m.user?._id)) ? "Online" : lastSeenText(m.user?.lastActiveAt)}</small></span></button>)}{!matches.length && <div className="cm-empty">No matches yet.</div>}</aside><main>{selected ? <><header className="cm-chat-header"><span>{selected.user?.name || "Conversation"}<small className={peerOnline ? "online" : ""}>{peerOnline ? "Online" : lastSeenText(selected.user?.lastActiveAt)}</small></span><button className="cm-chat-back" onClick={() => setSelected(null)}>Back</button></header><div className="cm-message-list">{error && <div className="cm-inline-error">{error}</div>}{messages.map(m => <MessageBubble key={m._id} message={m} mine={String(m.sender?._id || m.sender) === String(me?._id)}/>)}<i ref={end}/></div>{file && <div className="cm-chat-attachment-preview"><span>{file.type.startsWith("video/") ? "Video" : file.type === "image/gif" ? "GIF" : "Photo"}: {file.name}</span><button type="button" onClick={() => setFile(null)}><X size={16}/></button></div>}{showEmoji && <div className="cm-emoji-picker">{CHAT_EMOJIS.map(emoji => <button type="button" key={emoji} onClick={() => setText(value => value + emoji)}>{emoji}</button>)}</div>}<form onSubmit={send}><button type="button" className="cm-chat-tool" aria-label="Emoji" onClick={() => setShowEmoji(value => !value)}><Smile size={19}/></button><button type="button" className="cm-chat-tool" aria-label="Add photo, GIF, or video" onClick={() => fileInput.current?.click()}><Paperclip size={19}/></button><input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={chooseFile}/><input value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder={file ? "Add a caption…" : "Message…"}/><button aria-label="Send" disabled={sending}><Send size={18}/></button></form></> : <div className="cm-empty">Choose a conversation</div>}</main></section>;
}

function MessageBubble({ message, mine }) {
  const url = api.resolveMediaUrl(message.media?.url);
  return <div className={mine ? "mine" : "theirs"}>{url && (message.type === "video" ? <video src={url} controls playsInline/> : <img src={url} alt={message.type === "gif" ? "GIF" : "Shared photo"}/>)}{message.text && <span>{message.text}</span>}</div>;
}

export function NativeProfile({ me, onUserChange, onLogout }) {
  const [tab, setTab] = useState("posts"), [posts, setPosts] = useState([]), [reels, setReels] = useState([]), [saved, setSaved] = useState({ posts: [], reels: [] }), [edit, setEdit] = useState(false), [error, setError] = useState(""), [form, setForm] = useState({});
  const load = async () => { if (!me?._id) return; try { const [p, r, s] = await Promise.all([api.fetchUserPosts(me._id), api.fetchUserReels(me._id), api.fetchSavedContent(me._id)]); setPosts(Array.isArray(p) ? p : []); setReels(Array.isArray(r) ? r : []); setSaved({ posts: Array.isArray(s?.posts) ? s.posts : [], reels: Array.isArray(s?.reels) ? s.reels : [] }); setForm({ name: me.name || "", bio: me.bio || "", branch: me.branch || "", year: me.year || "", lookingFor: me.lookingFor || "", interests: (Array.isArray(me.interests) ? me.interests : []).join(", "), privacy: me.privacy?.postsDefault || "campus" }); setError(""); } catch (e) { setPosts([]); setReels([]); setSaved({ posts: [], reels: [] }); setError(errorText(e)); } };
  useEffect(() => { load(); }, [me?._id]);
  const save = async () => { try { const { privacy, ...values } = form; const user = await api.updateUserProfile(me._id, { ...values, privacy: { ...(me.privacy || {}), postsDefault: privacy }, interests: String(form.interests || "").split(",").map(x => x.trim()).filter(Boolean) }); onUserChange(user); setEdit(false); showToast("Profile updated successfully."); } catch (e) { const message = errorText(e); setError(message); showToast(message, "error"); } };
  const photo = async e => { const file = e.target.files?.[0]; if (!file) return; try { const result = await api.uploadProfilePhoto(me._id, file); onUserChange(result.user); showToast("Profile photo updated."); } catch (err) { const message = errorText(err); setError(message); showToast(message, "error"); } e.target.value = ""; };
  const logout = () => { disconnectChatSocket(); localStorage.removeItem("cm_token"); onLogout(); };
  if (!me?._id) return <section className="cm-native-profile"><div className="cm-empty">Your session is loading. Please try again.</div></section>;
  const items = tab === "posts" ? posts : tab === "reels" ? reels : [...(saved.posts || []), ...(saved.reels || [])];
  return <section className="cm-native-profile"><div className="cm-profile-summary"><label title="Change profile photo" style={{cursor:"pointer"}}><Avatar user={me} size={84}/><input hidden type="file" accept="image/*" onChange={photo}/></label><div><h2>{me?.name}</h2><p>{me?.bio || "Add a bio to introduce yourself."}</p><small>{me?.branch} {me?.year}</small></div></div><nav>{["posts","reels","saved","about"].map(x => <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>{x}</button>)}</nav>{error && <div className="cm-inline-error">{error}</div>}{tab === "about" ? <div className="cm-profile-actions"><button onClick={() => setEdit(true)}><Pencil/> Edit profile</button><button><Shield/> Privacy: {String(form.privacy || "campus")}</button>{me?.profilePhoto?.url&&<button onClick={()=>api.removeProfilePhoto(me._id).then(onUserChange)}><Trash2/> Remove profile photo</button>}<button onClick={logout}><LogOut/> Log out</button></div> : <MediaGrid items={items} reels={tab === "reels"}/>} {edit && <div className="cm-native-modal"><div className="cm-edit-profile"><header><strong>Edit profile</strong><button onClick={() => setEdit(false)}><X/></button></header>{["name","bio","branch","year","lookingFor","interests"].map(k => k === "bio" ? <textarea key={k} style={field} value={form[k] || ""} placeholder={k} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/> : <input key={k} style={field} value={form[k] || ""} placeholder={k} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>)}<select style={field} value={form.privacy || "campus"} onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))}><option value="campus">Campus</option><option value="public">Public</option><option value="private">Private</option></select><button style={button} onClick={save}>Save profile</button></div></div>}</section>;
}

function MediaGrid({ items, reels }) { const safeItems = Array.isArray(items) ? items : []; return !safeItems.length ? <div className="cm-empty">No content yet.</div> : <div className="cm-profile-grid">{safeItems.map(x => { const media = api.resolveMediaUrl(x?.videoUrl || x?.thumbnailUrl || x?.media?.[0]?.url); return <div key={x?._id || media}>{media ? <img src={media} alt=""/> : reels ? <Film/> : <ImageIcon/>}</div>; })}</div>; }
function FeatureLoading() { return <div className="cm-feature-loading"><Loader2/></div>; }
