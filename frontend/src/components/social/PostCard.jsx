import React from "react";
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";

export default function PostCard({ t, post, onLike, onComment, onSave, onMore }) {
  const author = post?.author || post?.user || {};
  return (
    <article className="cm-post-card" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <img src={author.avatar || author.photo || "/placeholder-avatar.png"} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{author.name || "CampusMate user"}</div><div style={{ color: t.textMuted, fontSize: 11 }}>{post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : ""}</div></div>
        <button onClick={() => onMore?.(post)} aria-label="More" style={{ border: 0, background: "transparent", color: t.textMuted, padding: 6, cursor: "pointer" }}><MoreHorizontal size={18} /></button>
      </div>
      {post?.image && <div style={{ width: "100%", aspectRatio: "4 / 3", background: t.bg2 }}><img src={post.image} alt={post.caption || "Post"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>}
      <div style={{ padding: "10px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => onLike?.(post)} aria-label="Like" style={{ border: 0, background: "transparent", color: post?.liked ? "#FB4570" : t.text, padding: 6, cursor: "pointer" }}><Heart size={19} fill={post?.liked ? "currentColor" : "none"} /></button>
          <button onClick={() => onComment?.(post)} aria-label="Comments" style={{ border: 0, background: "transparent", color: t.text, padding: 6, cursor: "pointer" }}><MessageCircle size={19} /></button>
          <button onClick={() => onSave?.(post)} aria-label="Save" style={{ marginLeft: "auto", border: 0, background: "transparent", color: t.text, padding: 6, cursor: "pointer" }}><Bookmark size={19} fill={post?.saved ? "currentColor" : "none"} /></button>
        </div>
        {(post?.likesCount != null || post?.commentsCount != null) && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{post?.likesCount || 0} likes · {post?.commentsCount || 0} comments</div>}
        {post?.caption && <p style={{ margin: "7px 0 0", fontSize: 13, lineHeight: 1.5 }}><strong>{author.name || "User"}</strong> {post.caption}</p>}
      </div>
    </article>
  );
}
