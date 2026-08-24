import { useEffect, useRef } from "react";
import { deletePost, fetchComments, fetchFeed, fetchMe, reportPost, sharePost } from "./api/client";

const TOAST_ID = "cm-phase-c-toast";

function toast(message, tone = "ok") {
  let node = document.getElementById(TOAST_ID);
  if (!node) {
    node = document.createElement("div");
    node.id = TOAST_ID;
    Object.assign(node.style, {
      position: "fixed", left: "50%", bottom: "92px", transform: "translateX(-50%)",
      zIndex: "12000", maxWidth: "calc(100vw - 28px)", padding: "10px 14px",
      borderRadius: "12px", fontSize: "12.5px", fontWeight: "700", color: "#fff",
      boxShadow: "0 14px 34px rgba(0,0,0,.28)", transition: "opacity .18s ease",
      pointerEvents: "none", opacity: "0"
    });
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.style.background = tone === "error" ? "#b4233b" : "#29245f";
  node.style.opacity = "1";
  clearTimeout(node._timer);
  node._timer = setTimeout(() => { node.style.opacity = "0"; }, 2200);
}

function findCard(caption) {
  if (!caption) return null;
  const textNodes = Array.from(document.querySelectorAll("span,p,div"));
  const hit = textNodes.find((node) => node.textContent?.trim().includes(caption.trim()) && node.textContent.trim().length < caption.trim().length + 80);
  if (!hit) return null;
  let node = hit;
  for (let i = 0; i < 8 && node; i += 1) {
    const style = node.getAttribute("style") || "";
    if (style.includes("margin-bottom: 16px") && style.includes("padding: 16px")) return node;
    node = node.parentElement;
  }
  return null;
}

function makeMenuButton(label, onClick, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  Object.assign(button.style, {
    width: "100%", textAlign: "left", border: "none", background: "transparent",
    color: danger ? "#fb607f" : "inherit", padding: "10px 12px", borderRadius: "9px",
    cursor: "pointer", fontSize: "12.5px", fontWeight: "700", minHeight: "40px"
  });
  button.addEventListener("click", onClick);
  return button;
}

function closeMenus() {
  document.querySelectorAll(".cm-phase-c-menu").forEach((el) => el.remove());
}

function attachActions(post, me) {
  const card = findCard(post.caption);
  if (!card || card.dataset.cmPhaseC === "1") return;
  card.dataset.cmPhaseC = "1";
  card.dataset.postId = post._id;

  const buttons = Array.from(card.querySelectorAll("button"));
  const moreButton = buttons.find((b) => b.querySelector("svg") && !b.textContent?.trim() && (b.getAttribute("style") || "").includes("padding: 4px"));
  const shareButton = buttons.find((b) => b.textContent?.trim() === "Share");
  const commentButton = buttons.find((b) => b.querySelector("svg") && /^\d+$/.test(b.textContent?.trim() || ""));

  if (shareButton && !shareButton.dataset.cmShare) {
    shareButton.dataset.cmShare = "1";
    shareButton.addEventListener("click", async (event) => {
      event.preventDefault(); event.stopPropagation();
      try {
        const result = await sharePost(post._id);
        if (navigator.share) {
          await navigator.share({ title: "CampusMate post", text: post.caption || "CampusMate post", url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href).catch(() => {});
        }
        toast(`Shared · ${result?.sharesCount ?? ""}`.trim());
      } catch (error) {
        toast(error.response?.data?.message || "Could not share post", "error");
      }
    }, true);
  }

  if (commentButton && !commentButton.dataset.cmComments) {
    commentButton.dataset.cmComments = "1";
    commentButton.addEventListener("click", async () => {
      try {
        const comments = await fetchComments(post._id);
        const count = Array.isArray(comments) ? comments.length : 0;
        const countNode = Array.from(commentButton.querySelectorAll("span")).find((s) => /^\d+$/.test(s.textContent?.trim() || ""));
        if (countNode) countNode.textContent = String(count);
      } catch (_) {}
    }, true);
  }

  if (!moreButton || moreButton.dataset.cmMenu) return;
  moreButton.dataset.cmMenu = "1";
  moreButton.addEventListener("click", (event) => {
    event.preventDefault(); event.stopPropagation(); closeMenus();
    const menu = document.createElement("div");
    menu.className = "cm-phase-c-menu";
    const dark = getComputedStyle(document.body).backgroundColor !== "rgb(245, 245, 251)";
    Object.assign(menu.style, {
      position: "absolute", right: "12px", top: "50px", zIndex: "300",
      width: "164px", padding: "6px", borderRadius: "12px",
      background: dark ? "#15182a" : "#fff", color: dark ? "#f2f1fb" : "#14121f",
      border: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(20,18,31,.10)",
      boxShadow: "0 18px 42px rgba(0,0,0,.28)"
    });
    card.style.position = "relative";

    const own = String(post.author?._id || post.author) === String(me?._id);
    if (own) {
      menu.appendChild(makeMenuButton("Delete post", async (e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this post?")) return;
        try {
          await deletePost(post._id);
          card.remove(); closeMenus(); toast("Post deleted");
          window.dispatchEvent(new Event("cm-posts-changed"));
        } catch (error) {
          toast(error.response?.data?.message || "Could not delete post", "error");
        }
      }, true));
    } else {
      menu.appendChild(makeMenuButton("Report post", async (e) => {
        e.stopPropagation();
        try {
          await reportPost(post._id, "inappropriate_content", "Reported from post menu");
          closeMenus(); toast("Report submitted");
        } catch (error) {
          toast(error.response?.data?.message || "Could not report post", "error");
        }
      }, true));
    }
    menu.appendChild(makeMenuButton("Share", async (e) => {
      e.stopPropagation();
      try { await sharePost(post._id); toast("Post shared"); closeMenus(); }
      catch (error) { toast(error.response?.data?.message || "Could not share post", "error"); }
    }));
    card.appendChild(menu);
  }, true);
}

async function enhance() {
  try {
    const [me, first] = await Promise.all([fetchMe().catch(() => null), fetchFeed("For You", 1)]);
    (first?.posts || []).forEach((post) => attachActions(post, me));
  } catch (_) {}
}

export default function PhaseCPostLayer() {
  const running = useRef(false);
  useEffect(() => {
    const run = () => {
      if (running.current) return;
      running.current = true;
      enhance().finally(() => { running.current = false; });
    };
    run();
    const observer = new MutationObserver(() => {
      clearTimeout(observer._timer);
      observer._timer = setTimeout(run, 250);
    });
    observer.observe(document.getElementById("root"), { childList: true, subtree: true });
    const changed = () => setTimeout(run, 300);
    window.addEventListener("cm-posts-changed", changed);
    window.addEventListener("cm-media-uploaded", changed);
    document.addEventListener("click", (event) => {
      if (!event.target.closest?.(".cm-phase-c-menu") && !event.target.closest?.("button[data-cm-menu='1']")) closeMenus();
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("cm-posts-changed", changed);
      window.removeEventListener("cm-media-uploaded", changed);
    };
  }, []);
  return null;
}
