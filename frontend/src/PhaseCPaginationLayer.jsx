import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, RefreshCw, MoreHorizontal, Heart, MessageCircle, Share2 } from "lucide-react";
import { deletePost, fetchFeed, fetchMe, reportPost, sharePost } from "./api/client";

function findPostsSection() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const postsTab = buttons.find((b) => b.textContent?.trim() === "Posts");
  if (!postsTab) return null;
  let node = postsTab.parentElement;
  for (let i = 0; i < 8 && node; i += 1) {
    if ((node.textContent || "").includes("Trending on Campus")) return node;
    node = node.parentElement;
  }
  return null;
}

function themeFromPage() {
  const root = document.querySelector(".cm-root");
  const bg = root ? getComputedStyle(root).backgroundColor : getComputedStyle(document.body).backgroundColor;
  const dark = bg !== "rgb(245, 245, 251)" && bg !== "rgb(255, 255, 255)";
  return dark
    ? { text: "#F2F1FB", muted: "rgba(242,241,251,.62)", surface: "rgba(255,255,255,.055)", border: "rgba(255,255,255,.10)", menu: "#15182a" }
    : { text: "#14121F", muted: "rgba(20,18,31,.62)", surface: "rgba(255,255,255,.75)", border: "rgba(20,18,31,.08)", menu: "#fff" };
}

function SkeletonCard({ t }) {
  const shimmer = { background: `linear-gradient(90deg, ${t.surface}, rgba(128,120,200,.14), ${t.surface})`, backgroundSize: "200% 100%", animation: "cmShimmer 1.4s linear infinite" };
  return <div style={{ border: `1px solid ${t.border}`, borderRadius: 20, padding: 16, marginBottom: 16, background: t.surface }}>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ width: 42, height: 42, borderRadius: "50%", ...shimmer }} /><div style={{ flex: 1 }}><div style={{ height: 12, width: "38%", borderRadius: 999, ...shimmer }} /><div style={{ height: 9, width: "58%", borderRadius: 999, marginTop: 7, ...shimmer }} /></div></div>
    <div style={{ height: 210, borderRadius: 16, marginTop: 12, ...shimmer }} /><div style={{ height: 10, width: "76%", borderRadius: 999, marginTop: 12, ...shimmer }} />
  </div>;
}

function ExtraPostCard({ post, t, me, onRemoved }) {
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const author = post.author || {};
  const media = post.media?.[0]?.url;
  const own = String(author?._id || author) === String(me?._id);

  const doShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await sharePost(post._id);
      if (navigator.share) await navigator.share({ title: "CampusMate post", text: post.caption || "CampusMate post", url: window.location.href }).catch(() => {});
      else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setMenu(false);
    } finally { setBusy(false); }
  };

  const doDelete = async () => {
    if (busy || !window.confirm("Delete this post?")) return;
    setBusy(true);
    try { await deletePost(post._id); onRemoved(post._id); window.dispatchEvent(new Event("cm-posts-changed")); }
    finally { setBusy(false); }
  };

  const doReport = async () => {
    if (busy) return;
    setBusy(true);
    try { await reportPost(post._id, "inappropriate_content", "Reported from paginated feed"); setMenu(false); }
    finally { setBusy(false); }
  };

  return <article data-cm-paged-post={post._id} style={{ position: "relative", border: `1px solid ${t.border}`, borderRadius: 20, padding: 16, marginBottom: 16, background: t.surface, backdropFilter: "blur(16px)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {author.profilePhoto?.url ? <img src={author.profilePhoto.url} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#6D5DF6,#A855F7)", color: "white", fontWeight: 700 }}>{author.name?.[0] || "U"}</div>}
      <div style={{ flex: 1 }}><div style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{author.name || "CampusMate user"}</div><div style={{ color: t.muted, fontSize: 11.5 }}>{author.collegeName || post.college || "Campus"}</div></div>
      <button aria-label="Post actions" onClick={() => setMenu((v) => !v)} style={{ minWidth: 40, minHeight: 40, border: "none", borderRadius: 10, background: "transparent", color: t.muted, cursor: "pointer", display: "grid", placeItems: "center" }}><MoreHorizontal size={19} /></button>
    </div>
    {menu && <div style={{ position: "absolute", right: 14, top: 58, zIndex: 20, width: 170, padding: 6, borderRadius: 12, background: t.menu, color: t.text, border: `1px solid ${t.border}`, boxShadow: "0 18px 42px rgba(0,0,0,.28)" }}>
      <button disabled={busy} onClick={own ? doDelete : doReport} style={{ width: "100%", minHeight: 40, border: "none", background: "transparent", color: own ? "#fb607f" : t.text, textAlign: "left", padding: "9px 11px", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>{own ? "Delete post" : "Report post"}</button>
      <button disabled={busy} onClick={doShare} style={{ width: "100%", minHeight: 40, border: "none", background: "transparent", color: t.text, textAlign: "left", padding: "9px 11px", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>Share</button>
    </div>}
    {media && <img src={media} alt={post.caption || "Post"} loading="lazy" style={{ width: "100%", maxHeight: 440, objectFit: "cover", borderRadius: 16, marginTop: 12 }} />}
    {post.caption && <p style={{ color: t.text, fontSize: 13, lineHeight: 1.5, margin: "12px 0 0" }}>{post.caption}</p>}
    <div style={{ display: "flex", gap: 18, color: t.muted, fontSize: 12, marginTop: 12, alignItems: "center" }}><span style={{ display: "flex", gap: 5, alignItems: "center" }}><Heart size={15} />{post.likesCount ?? post.likes?.length ?? 0}</span><span style={{ display: "flex", gap: 5, alignItems: "center" }}><MessageCircle size={15} />{post.commentsCount ?? 0}</span><button onClick={doShare} disabled={busy} style={{ border: "none", background: "transparent", color: t.muted, padding: 0, cursor: "pointer", display: "flex", gap: 5, alignItems: "center", fontSize: 12 }}><Share2 size={15} />{post.sharesCount ?? 0}</button></div>
  </article>;
}

export default function PhaseCPaginationLayer() {
  const [target, setTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("For You");
  const [themeTick, setThemeTick] = useState(0);
  const [me, setMe] = useState(null);

  useEffect(() => { if (localStorage.getItem("cm_token")) fetchMe().then(setMe).catch(() => setMe(null)); }, []);

  useEffect(() => {
    const sync = () => {
      const section = findPostsSection();
      setTarget(section);
      if (!section) return;
      const active = Array.from(section.querySelectorAll("button")).find((b) => ["For You","Following","GGITS","GGCT","GGCE"].includes(b.textContent?.trim()) && (b.getAttribute("style") || "").includes("109, 93, 246"));
      const nextFilter = active?.textContent?.trim();
      if (nextFilter && nextFilter !== filter) { setFilter(nextFilter); setPage(1); setItems([]); setHasMore(false); setError(""); }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    const onTheme = () => setThemeTick((x) => x + 1);
    window.addEventListener("cm-media-uploaded", sync);
    window.addEventListener("storage", onTheme);
    return () => { mo.disconnect(); window.removeEventListener("cm-media-uploaded", sync); window.removeEventListener("storage", onTheme); };
  }, [filter]);

  const t = useMemo(() => themeFromPage(), [themeTick, target]);

  useEffect(() => {
    if (!target || !localStorage.getItem("cm_token")) return;
    let dead = false;
    setBusy(true); setError("");
    fetchFeed(filter === "For You" ? undefined : filter, 1).then((data) => {
      if (!dead) { setHasMore(!!data?.hasMore); setPage(1); }
    }).catch(() => { if (!dead) setError("Could not check for more posts."); }).finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [target, filter]);

  const loadMore = async () => {
    if (busy || !hasMore) return;
    const next = page + 1; setBusy(true); setError("");
    try {
      const data = await fetchFeed(filter === "For You" ? undefined : filter, next);
      const known = new Set(items.map((p) => p._id));
      const fresh = (data?.posts || []).filter((p) => !known.has(p._id));
      setItems((prev) => [...prev, ...fresh]); setPage(next); setHasMore(!!data?.hasMore);
      setTimeout(() => document.dispatchEvent(new Event("cm-posts-page-loaded")), 0);
    } catch (e) { setError(e?.response?.data?.message || "Could not load more posts."); }
    finally { setBusy(false); }
  };

  const removeItem = (id) => setItems((prev) => prev.filter((p) => p._id !== id));

  if (!target || !localStorage.getItem("cm_token")) return null;

  return createPortal(<div data-cm-pagination style={{ marginTop: 14, paddingBottom: 6 }}>
    {items.map((p) => <ExtraPostCard key={p._id} post={p} t={t} me={me} onRemoved={removeItem} />)}
    {busy && page > 1 && <><SkeletonCard t={t} /><SkeletonCard t={t} /></>}
    {!busy && hasMore && <button onClick={loadMore} style={{ width: "100%", minHeight: 44, border: "none", borderRadius: 14, padding: "11px 16px", background: "linear-gradient(135deg,#6D5DF6,#A855F7)", color: "white", fontWeight: 700, cursor: "pointer" }}>Load more posts</button>}
    {!busy && !hasMore && page > 1 && <div style={{ textAlign: "center", padding: "12px 8px", color: t.muted, fontSize: 12 }}>You're all caught up.</div>}
    {error && <button onClick={loadMore} style={{ width: "100%", minHeight: 44, borderRadius: 14, padding: "10px 14px", background: t.surface, color: t.text, border: `1px solid ${t.border}`, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}><RefreshCw size={13} /> Retry loading posts</button>}
    {busy && page === 1 && <div style={{ display: "flex", justifyContent: "center", padding: 8, color: t.muted }}><Loader2 size={15} style={{ animation: "cmSpin 1s linear infinite" }} /></div>}
  </div>, target);
}
