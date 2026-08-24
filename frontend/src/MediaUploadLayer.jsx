import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Clapperboard,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { createPost, createReel, createStory, fetchFeed, fetchReels, fetchMe } from "./api/client";

const MODE_META = {
  photo: { title: "New Photo Post", accept: "image/jpeg,image/png,image/webp", icon: ImageIcon, label: "Choose image(s)", multiple: true },
  reel: { title: "New Reel", accept: "video/mp4,video/webm", icon: Clapperboard, label: "Choose video", multiple: false },
  story: { title: "New Story", accept: "image/jpeg,image/png,image/webp,video/mp4,video/webm", icon: Camera, label: "Choose image or video", multiple: false },
};

function prettyBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function findCardForCaption(caption) {
  if (!caption) return null;
  const nodes = Array.from(document.querySelectorAll("div,span,p"));
  const hit = nodes.find((node) => node.textContent?.trim() === caption);
  if (!hit) return null;
  let node = hit;
  for (let i = 0; i < 6 && node; i += 1) {
    const style = node.getAttribute("style") || "";
    if (style.includes("border-radius: 20px") && style.includes("padding: 16px")) return node;
    node = node.parentElement;
  }
  return hit.closest("div");
}

function hydratePostMedia(posts) {
  (posts || []).forEach((post) => {
    const mediaUrl = post?.media?.[0]?.url;
    if (!mediaUrl || !post?.caption) return;

    const card = findCardForCaption(post.caption);
    if (!card) return;

    const mediaBox = Array.from(card.querySelectorAll("div")).find((el) => {
      const style = el.getAttribute("style") || "";
      return style.includes("height: 300px") && style.includes("border-radius: 16px");
    });
    if (!mediaBox || mediaBox.querySelector(".cm-live-media") || mediaBox.querySelector(".cm-live-media-video")) return;

    mediaBox.style.position = "relative";
    const img = document.createElement("img");
    img.className = "cm-live-media";
    img.src = mediaUrl;
    img.alt = post.caption;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    Object.assign(img.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "16px",
      zIndex: "1",
    });
    img.onerror = () => img.remove();
    mediaBox.insertBefore(img, mediaBox.firstChild);

    mediaBox.querySelectorAll(":scope > svg").forEach((svg) => {
      svg.style.display = "none";
    });
  });
}

function hydrateReelMedia(reels) {
  (reels || []).forEach((reel) => {
    if (!reel?.videoUrl || !reel?.caption) return;
    const card = findCardForCaption(reel.caption);
    if (!card) return;

    const reelBox = Array.from(card.querySelectorAll("div")).find((el) => {
      const style = el.getAttribute("style") || "";
      return style.includes("height: 100%") && style.includes("scroll-snap-align: start");
    }) || card;
    if (reelBox.querySelector(".cm-live-media-video")) return;

    const video = document.createElement("video");
    video.className = "cm-live-media-video";
    video.src = reel.videoUrl;
    video.autoplay = false;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = false;
    Object.assign(video.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "20px",
      zIndex: "0",
      opacity: "1",
    });
    video.onerror = () => video.remove();
    reelBox.style.position = "relative";
    reelBox.insertBefore(video, reelBox.firstChild);
  });
}

async function hydrateLiveMedia() {
  try {
    const [feed, reels] = await Promise.all([
      fetchFeed("For You", 1).catch(() => ({ posts: [] })),
      fetchReels(undefined, 1).catch(() => []),
    ]);
    hydratePostMedia(feed?.posts || []);
    hydrateReelMedia(reels || []);
  } catch (_) {
    // UI continues to work even if the feed is temporarily unavailable.
  }
}

export default function MediaUploadLayer() {
  const [mode, setMode] = useState(null);
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);
  const objectUrls = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    fetchMe().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => () => objectUrls.forEach(({ url }) => URL.revokeObjectURL(url)), [objectUrls]);

  useEffect(() => {
    hydrateLiveMedia();

    const onMediaUploaded = () => {
      setTimeout(hydrateLiveMedia, 900);
      setTimeout(hydrateLiveMedia, 2200);
    };

    const onClickCapture = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const text = target.textContent?.trim();

      let nextMode = null;
      if (text === "Photo Post") nextMode = "photo";
      else if (text === "Reel") nextMode = "reel";
      else if (text === "Your Story") nextMode = "story";

      if (!nextMode) return;

      event.preventDefault();
      event.stopPropagation();
      setError("");
      setSuccess("");
      setFiles([]);
      setCaption("");
      setHashtags("");
      setMode(nextMode);
    };

    document.addEventListener("cm-media-uploaded", onMediaUploaded);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      document.removeEventListener("cm-media-uploaded", onMediaUploaded);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  useEffect(() => {
    if (!mode) return;
    const timer = setTimeout(() => inputRef.current?.click(), 80);
    return () => clearTimeout(timer);
  }, [mode]);

  const close = () => {
    if (busy) return;
    setMode(null);
    setFiles([]);
    setCaption("");
    setHashtags("");
    setError("");
    setSuccess("");
  };

  const onChoose = (event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (!chosen.length) return;

    const limit = mode === "photo" ? 10 : 1;
    const maxMb = mode === "reel" ? 100 : 10;
    const valid = chosen.filter((file) => file.size <= maxMb * 1024 * 1024);

    if (!valid.length) {
      setError(`File is too large. ${mode === "reel" ? "Reels" : "Images"} must be under ${maxMb}MB.`);
      return;
    }
    if (valid.length !== chosen.length) {
      setError(`Some files were skipped because they exceed the ${maxMb}MB limit.`);
    }
    setFiles(valid.slice(0, limit));
  };

  const publish = async () => {
    if (!user?._id) {
      setError("Please log in again before uploading media.");
      return;
    }
    if (!files.length) {
      setError("Choose a file first.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const tags = hashtags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
        .join(",");

      if (mode === "photo") {
        const form = new FormData();
        files.forEach((file) => form.append("media", file));
        form.append("type", files.length > 1 ? "carousel" : "photo");
        form.append("caption", caption.trim());
        form.append("hashtags", tags);
        await createPost(form);
        setSuccess("Photo post uploaded to Cloudinary ✨");
      } else if (mode === "reel") {
        const form = new FormData();
        form.append("video", files[0]);
        form.append("caption", caption.trim());
        form.append("hashtags", tags);
        form.append("duration", "30");
        await createReel(form);
        setSuccess("Reel uploaded to Cloudinary 🎬");
      } else {
        const file = files[0];
        const form = new FormData();
        form.append("media", file);
        form.append("type", file.type.startsWith("video/") ? "video" : "image");
        await createStory(form);
        setSuccess("Story uploaded — it will expire after 24 hours.");
      }

      window.dispatchEvent(new Event("cm-media-uploaded"));
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!mode) return null;
  const meta = MODE_META[mode];
  const Icon = meta.icon;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={busy ? undefined : close} style={{ position: "absolute", inset: 0, background: "rgba(4,5,12,.76)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", borderRadius: 24, background: "#10142a", border: "1px solid rgba(255,255,255,.12)", padding: 20, boxShadow: "0 30px 80px -20px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(109,93,246,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} color="#8b7cff" /></div>
          <div style={{ flex: 1 }}><div style={{ color: "#f2f1fb", fontWeight: 700, fontSize: 16 }}>{meta.title}</div><div style={{ color: "rgba(242,241,251,.55)", fontSize: 11.5 }}>Real Cloudinary upload</div></div>
          <button onClick={close} disabled={busy} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.7)", cursor: busy ? "not-allowed" : "pointer" }}><X size={17} /></button>
        </div>

        <input ref={inputRef} type="file" accept={meta.accept} multiple={meta.multiple} onChange={onChoose} style={{ display: "none" }} />

        <button onClick={() => inputRef.current?.click()} disabled={busy} style={{ width: "100%", minHeight: 160, borderRadius: 18, border: "1.5px dashed rgba(255,255,255,.18)", background: "rgba(255,255,255,.03)", color: "rgba(242,241,251,.72)", cursor: busy ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 }}>
          <Plus size={24} color="#8b7cff" />
          <strong style={{ fontSize: 14 }}>{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : meta.label}</strong>
          <span style={{ fontSize: 11.5, opacity: .6 }}>{mode === "reel" ? "MP4/WebM · up to 100MB" : mode === "story" ? "Image or video · up to 10MB" : "JPG/PNG/WebP · up to 10MB each"}</span>
        </button>

        {objectUrls.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: mode === "photo" && objectUrls.length > 1 ? "repeat(3,1fr)" : "1fr", gap: 8, marginTop: 12 }}>
            {objectUrls.map(({ file, url }) => (
              <div key={`${file.name}-${file.lastModified}`} style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }}>
                {file.type.startsWith("video/") ? <video src={url} controls muted playsInline style={{ width: "100%", maxHeight: 280, display: "block", objectFit: "cover" }} /> : <img src={url} alt={file.name} style={{ width: "100%", maxHeight: 280, display: "block", objectFit: "cover" }} />}
                <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, padding: "5px 7px", borderRadius: 8, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 10.5 }}>{file.name} · {prettyBytes(file.size)}</div>
              </div>
            ))}
          </div>
        )}

        {mode !== "story" && <>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 500))} placeholder="Write a caption..." rows={3} disabled={busy} style={{ width: "100%", marginTop: 14, resize: "vertical", minHeight: 90, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", color: "#f2f1fb", padding: 12, fontSize: 13.5, outline: "none" }} />
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#CampusLife, #GGITS" disabled={busy} style={{ width: "100%", marginTop: 8, borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", color: "#f2f1fb", padding: "10px 12px", fontSize: 12.5, outline: "none" }} />
        </>}

        {error && <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: "rgba(251,69,112,.1)", border: "1px solid rgba(251,69,112,.2)", color: "#ff8ca8", fontSize: 12.5 }}>{error}</div>}
        {success && <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.2)", color: "#7ee7bf", fontSize: 12.5 }}>{success}</div>}

        <button onClick={publish} disabled={busy || !files.length} style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 14, padding: "12px 16px", background: busy || !files.length ? "rgba(255,255,255,.08)" : "linear-gradient(135deg,#6D5DF6,#A855F7)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: busy || !files.length ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {busy ? <><Loader2 size={16} style={{ animation: "cm-spin 1s linear infinite" }} /> Uploading...</> : <><Send size={16} /> Upload to CampusMate</>}
        </button>
      </div>
      <style>{`@keyframes cm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
