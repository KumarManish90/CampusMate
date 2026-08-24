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

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function findPostCardFromButton(button) {
  let node = button;
  for (let i = 0; i < 10 && node; i += 1) {
    if (node.tagName === "DIV") {
      const hasShare = Array.from(node.querySelectorAll("button")).some((b) => normalize(b.textContent) === "Share");
      const style = node.getAttribute("style") || "";
      if (hasShare && (style.includes("border-radius: 20px") || style.includes("margin-bottom: 16px") || style.includes("padding: 16px"))) return node;
    }
    node = node.parentElement;
  }
  return null;
}

function findMoreButtons() {
  return Array.from(document.querySelectorAll("button")).filter((button) => {
    const svg = button.querySelector("svg");
    if (!svg || normalize(button.textContent)) return false;
    const cls = svg.getAttribute("class") || "";
    const aria = button.getAttribute("aria-label") || "";
    return /ellipsis|more-horizontal/i.test(cls) || /post actions/i.test(aria);
  });
}

function matchPostToCard(card, posts) {
  const cardText = normalize(card.textContent);
  const byCaption = posts.find((post) => post.caption && cardText.includes(normalize(post.caption)));
  if (byCaption) return byCaption;
  return posts.find((post) => {
    const name = normalize(post.author?.name);
    return name && cardText.includes(name);
  }) || null;
}

function makeMenuButton(label, onClick, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  Object.assign(button.style, {
    width: "100%", minHeight: "44px", textAlign: "left", border: "none", background: "transparent",
    color: danger ? "#fb607f" : "inherit", padding: "10px 12px", borderRadius: "9px",
    cursor: "pointer", fontSize: "12.5px", fontWeight: "700"
  });
  button.addEventListener("click", onClick);
  return button;
}

function closeMenus(except = null) {
  document.querySelectorAll(".cm-phase-c-menu").forEach((el) => {
    if (el !== except) el.remove();
  });
}

function themeIsDark() {
  const root = document.querySelector(".cm-root");
  const bg = root ? getComputedStyle(root).backgroundColor : getComputedStyle(document.body).backgroundColor;
  return bg !== "rgb(245, 245, 251)" && bg !== "rgb(255, 255, 255)";
}

function refreshCommentCount(commentButton, postId) {
  return fetchComments(postId).then((comments) => {
    const count = Array.isArray(comments) ? comments.length : 0;
    const countNode = Array.from(commentButton.querySelectorAll("span")).find((s) => /^\d+$/.test(normalize(s.textContent)));
    if (countNode) countNode.textContent = String(count);
    return count;
  });
}

function incrementShareCount(shareButton, result) {
  const count = result?.sharesCount;
  if (!Number.isFinite(count)) return;
  const spans = Array.from(shareButton.querySelectorAll("span"));
  const numeric = spans.find((s) => /^\d+$/.test(normalize(s.textContent)));
  if (numeric) numeric.textContent = String(count);
}

function attachActions(card, post, me, moreButton) {
  if (!card || !post || !moreButton) return;
  card.dataset.cmPhaseC = "1";
  card.dataset.postId = post._id;
  card.style.position = "relative";

  const buttons = Array.from(card.querySelectorAll("button"));
  const shareButton = buttons.find((b) => normalize(b.textContent) === "Share");
  const commentButton = buttons.find((b) => {
    if (b === moreButton) return false;
    const text = normalize(b.textContent);
    return /^\d+$/.test(text) && !!b.querySelector("svg");
  });

  if (shareButton && !shareButton.dataset.cmShare) {
    shareButton.dataset.cmShare = "1";
    shareButton.addEventListener("click", async (event) => {
      event.preventDefault(); event.stopPropagation();
      try {
        const result = await sharePost(post._id);
        incrementShareCount(shareButton, result);
        if (navigator.share) await navigator.share({ title: "CampusMate post", text: post.caption || "CampusMate post", url: window.location.href }).catch(() => {});
        else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href).catch(() => {});
        toast(`Shared${Number.isFinite(result?.sharesCount) ? ` · ${result.sharesCount}` : ""}`);
      } catch (error) {
        toast(error.response?.data?.message || "Could not share post", "error");
      }
    });
  }

  if (commentButton && !commentButton.dataset.cmComments) {
    commentButton.dataset.cmComments = "1";
    commentButton.addEventListener("click", () => refreshCommentCount(commentButton, post._id).catch(() => {}));
    refreshCommentCount(commentButton, post._id).catch(() => {});
  }

  if (moreButton.dataset.cmMenu === "1") return;
  moreButton.dataset.cmMenu = "1";
  moreButton.setAttribute("aria-label", "Post actions");
  moreButton.style.minWidth = "40px";
  moreButton.style.minHeight = "40px";

  moreButton.addEventListener("click", (event) => {
    event.preventDefault(); event.stopPropagation();
    const existing = card.querySelector(":scope > .cm-phase-c-menu");
    if (existing) { existing.remove(); return; }

    closeMenus();
    const menu = document.createElement("div");
    menu.className = "cm-phase-c-menu";
    menu.setAttribute("role", "menu");
    const dark = themeIsDark();
    const rect = moreButton.getBoundingClientRect();
    const narrow = window.innerWidth <= 520;
    Object.assign(menu.style, {
      position: narrow ? "fixed" : "absolute",
      right: narrow ? `${Math.max(12, window.innerWidth - rect.right)}px` : "12px",
      top: narrow ? `${Math.min(window.innerHeight - 150, rect.bottom + 6)}px` : "54px",
      zIndex: "300", width: "172px", padding: "6px", borderRadius: "12px",
      background: dark ? "#15182a" : "#fff", color: dark ? "#f2f1fb" : "#14121f",
      border: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(20,18,31,.10)",
      boxShadow: "0 18px 42px rgba(0,0,0,.28)"
    });

    const own = String(post.author?._id || post.author) === String(me?._id);
    menu.appendChild(makeMenuButton(own ? "Delete post" : "Report post", async (e) => {
      e.stopPropagation();
      try {
        if (own) {
          if (!window.confirm("Delete this post?")) return;
          await deletePost(post._id);
          card.remove();
          toast("Post deleted");
          window.dispatchEvent(new Event("cm-posts-changed"));
        } else {
          await reportPost(post._id, "inappropriate_content", "Reported from post menu");
          toast("Report submitted");
        }
        closeMenus();
      } catch (error) {
        toast(error.response?.data?.message || (own ? "Could not delete post" : "Could not report post"), "error");
      }
    }, own));

    menu.appendChild(makeMenuButton("Share", async (e) => {
      e.stopPropagation();
      try {
        const result = await sharePost(post._id);
        if (shareButton) incrementShareCount(shareButton, result);
        if (navigator.share) await navigator.share({ title: "CampusMate post", text: post.caption || "CampusMate post", url: window.location.href }).catch(() => {});
        else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href).catch(() => {});
        toast("Post shared");
        closeMenus();
      } catch (error) {
        toast(error.response?.data?.message || "Could not share post", "error");
      }
    }));

    (narrow ? document.body : card).appendChild(menu);
  });
}

async function enhance() {
  if (!localStorage.getItem("cm_token")) return;
  try {
    const [me, first] = await Promise.all([fetchMe().catch(() => null), fetchFeed("For You", 1)]);
    const posts = first?.posts || [];
    if (!posts.length) return;
    findMoreButtons().forEach((moreButton) => {
      if (moreButton.closest("[data-cm-paged-post]")) return;
      if (moreButton.dataset.cmMenu === "1") return;
      const card = findPostCardFromButton(moreButton);
      const post = card ? matchPostToCard(card, posts) : null;
      if (card && post) attachActions(card, post, me, moreButton);
    });
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
      observer._timer = setTimeout(run, 160);
    });
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, subtree: true });

    const changed = () => setTimeout(run, 160);
    window.addEventListener("cm-posts-changed", changed);
    window.addEventListener("cm-media-uploaded", changed);
    document.addEventListener("cm-posts-page-loaded", changed);

    const outsideClick = (event) => {
      if (!event.target.closest?.(".cm-phase-c-menu") && !event.target.closest?.("button[data-cm-menu='1']")) closeMenus();
    };
    const keydown = (event) => { if (event.key === "Escape") closeMenus(); };
    const resize = () => closeMenus();
    document.addEventListener("click", outsideClick);
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", resize, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("cm-posts-changed", changed);
      window.removeEventListener("cm-media-uploaded", changed);
      document.removeEventListener("cm-posts-page-loaded", changed);
      document.removeEventListener("click", outsideClick);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", resize, true);
    };
  }, []);
  return null;
}
