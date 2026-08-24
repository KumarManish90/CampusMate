import React, { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { fetchFeed } from "./api/client";

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
  const bg = root ? getComputedStyle(root).backgroundColor : "rgb(10, 13, 26)";
  const dark = bg !== "rgb(245, 245, 251)" && bg !== "rgb(255, 255, 255)";
  return dark
    ? { text: "#F2F1FB", muted: "rgba(242,241,251,.62)", faint: "rgba(242,241,251,.38)", surface: "rgba(255,255,255,.055)", border: "rgba(255,255,255,.10)" }
    : { text: "#14121F", muted: "rgba(20,18,31,.62)", faint: "rgba(20,18,31,.40)", surface: "rgba(255,255,255,.75)", border: "rgba(20,18,31,.08)" };
}

function SkeletonCard({ t }) {
  const shimmer = { background: `linear-gradient(90deg, ${t.surface}, rgba(128,120,200,.14), ${t.surface})`, backgroundSize: "200% 100%", animation: "cmShimmer 1.4s linear infinite" };
  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 20, padding: 16, marginBottom: 16, background: t.surface }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", ...shimmer }} />
        <div style={{ flex: 1 }}><div style={{ height: 12, width: "38%", borderRadius: 999, ...shimmer }} /><div style={{ height: 9, width: "58%", borderRadius: 999, marginTop: 7, ...shimmer }} /></div>
      </div>
      <div style={{ height: 210, borderRadius: 16, marginTop: 12, ...shimmer }} />
      <div style={{ height: 10, width: "76%", borderRadius: 999, marginTop: 12, ...shimmer }} />
    </div>
  );
}

function ExtraPostCard({ post, t }) {
  const author = post.author || {};
  const media = post.media?.[0]?.url;
  return (
    <article data-cm-paged-post={post._id} style={{ border: `1px solid ${t.border}`, borderRadius: 20, padding: 16, marginBottom: 16, background: t.surface, backdropFilter: "blur(16px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {author.profilePhoto?.url ? <img src={author.profilePhoto.url} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#6D5DF6,#A855F7)", color: "white", fontWeight: 700 }}>{author.name?.[0] || "U"}</div>}
        <div><div style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{author.name || "CampusMate user"}</div><div style={{ color: t.muted, fontSize: 11.5 }}>{author.collegeName || post.college || "Campus"}</div></div>
      </div>
      {media && <img src={media} alt={post.caption || "Post"} loading="lazy" style={{ width: "100%", maxHeight: 440, objectFit: "cover", borderRadius: 16, marginTop: 12 }} />}
      {post.caption && <p style={{ color: t.text, fontSize: 13, lineHeight: 1.5, margin: "12px 0 0" }}>{post.caption}</p>}
      <div style={{ display: "flex", gap: 16, color: t.muted, fontSize: 12, marginTop: 10 }}><span>♥ {post.likesCount ?? post.likes?.length ?? 0}</span><span>💬 {post.commentsCount ?? 0}</span><span>↗ {post.sharesCount ?? 0}</span></div>
    </article>
  );
}

export default function PhaseCPaginationLayer() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("For You");
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const sync = () => {
      const section = findPostsSection();
      setMounted(!!section);
      if (!section) return;
      const active = Array.from(section.querySelectorAll("button")).find((b) => ["For You","Following","GGITS","GGCT","GGCE"].includes(b.textContent?.trim()) && (b.getAttribute("style") || "").includes("109, 93, 246"));
      if (active?.textContent?.trim() && active.textContent.trim() !== filter) {
        setFilter(active.textContent.trim());
        setPage(1); setItems([]); setHasMore(false); setError("");
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    const onTheme = () => setThemeTick((x) => x + 1);
    window.addEventListener("cm-media-uploaded", sync);
    window.addEventListener("storage", onTheme);
    return () => { mo.disconnect(); window.removeEventListener("cm-media-uploaded", sync); window.removeEventListener("storage", onTheme); };
  }, [filter]);

  const t = useMemo(() => themeFromPage(), [themeTick, mounted]);

  useEffect(() => {
    if (!mounted || !localStorage.getItem("cm_token")) return;
    let dead = false;
    setBusy(true); setError("");
    fetchFeed(filter === "For You" ? undefined : filter, 1)
      .then((data) => { if (!dead) { setHasMore(!!data?.hasMore); setPage(1); } })
      .catch(() => { if (!dead) setError("Could not check for more posts."); })
      .finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [mounted, filter]);

  const loadMore = async () => {
    if (busy || !hasMore) return;
    const next = page + 1;
    setBusy(true); setError("");
    try {
      const data = await fetchFeed(filter === "For You" ? undefined : filter, next);
      const known = new Set(items.map((p) => p._id));
      const fresh = (data?.posts || []).filter((p) => !known.has(p._id));
      setItems((prev) => [...prev, ...fresh]);
      setPage(next);
      setHasMore(!!data?.hasMore);
      setTimeout(() => document.dispatchEvent(new Event("cm-posts-page-loaded")), 0);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load more posts.");
    } finally { setBusy(false); }
  };

  if (!mounted || !localStorage.getItem("cm_token")) return null;

  return (
    <div style={{ position: "fixed", left: "50%", bottom: 90, transform: "translateX(-50%)", zIndex: 55, pointerEvents: "none", width: "min(92vw,520px)" }}>
      <div style={{ pointerEvents: "auto" }}>
        {items.length > 0 && <div id="cm-paged-post-buffer" style={{ display: "none" }}>{items.map((p) => <ExtraPostCard key={p._id} post={p} t={t} />)}</div>}
        {busy && page > 1 && <div style={{ borderRadius: 14, padding: "10px 14px", background: t.surface, border: `1px solid ${t.border}`, color: t.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><Loader2 size={14} style={{ animation: "cmSpin 1s linear infinite" }} /> Loading more posts…</div>}
        {!busy && hasMore && <button onClick={loadMore} style={{ width: "100%", border: "none", borderRadius: 14, padding: "11px 16px", background: "linear-gradient(135deg,#6D5DF6,#A855F7)", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,.22)" }}>Load more posts</button>}
        {error && <button onClick={loadMore} style={{ width: "100%", borderRadius: 14, padding: "10px 14px", background: t.surface, color: t.text, border: `1px solid ${t.border}`, display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}><RefreshCw size={13} /> Retry loading posts</button>}
      </div>
    </div>
  );
}
