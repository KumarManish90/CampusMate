import React from "react";

export default function ProfileHeader({ t, user, isOwn, onEdit, onFollow }) {
  return (
    <section className="cm-profile-header" style={{ display: "flex", gap: 18, alignItems: "center", padding: "18px 0", flexWrap: "wrap" }}>
      <img src={user?.avatar || user?.photo || "/placeholder-avatar.png"} alt={user?.name || "Profile"} style={{ width: 92, height: 92, borderRadius: "50%", objectFit: "cover", border: `3px solid ${t.surface}` }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{user?.name || "CampusMate User"}</h2>
        {user?.username && <div style={{ color: t.textMuted, fontSize: 13, marginTop: 3 }}>@{user.username}</div>}
        {user?.bio && <p style={{ margin: "8px 0", fontSize: 13, lineHeight: 1.45 }}>{user.bio}</p>}
        <div style={{ display: "flex", gap: 18, fontSize: 12, color: t.textMuted }}><span><strong>{user?.postsCount || 0}</strong> posts</span><span><strong>{user?.followersCount || 0}</strong> followers</span><span><strong>{user?.followingCount || 0}</strong> following</span></div>
      </div>
      <button onClick={isOwn ? onEdit : onFollow} style={{ minHeight: 42, padding: "0 18px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.surface, color: t.text, fontWeight: 700, cursor: "pointer" }}>{isOwn ? "Edit profile" : "Follow"}</button>
    </section>
  );
}
