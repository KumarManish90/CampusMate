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
      const text = normalize(node.textContent);
      const hasActions = Array.from(node.querySelectorAll(":scope button")).some((b) => normalize(b.textContent) === "Share");
      const style = node.getAttribute("style") || "";
      if (hasActions && (style.includes("border-radius: 20px") || style.includes("margin-bottom: 16px") || style.includes("padding: 16px"))) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

function findMoreButtons() {
  const selectors = [
    "button:has(svg.lucide-ellipsis)",
    "button:has(svg.lucide-more-horizontal)",
    "button:has(svg[class*='ellipsis'])",
  ];
  for (const selector of selectors) {
    try {
      const found = Array.from(document.querySelectorAll(selector));
      if (found.length) return found;
    } catch (_) {}
  }
  return Array.from(document.querySelectorAll("button")).filter((button) => {
    const svg = button.querySelector("svg");
    if (!svg || normalize(button.textContent)) return false;
    const cls = svg.getAttribute("class") || "";
    return /ellipsis|more-horizontal/i.test(cls);
  });
}

function matchPostToCard(card, posts) {
  const cardText = normalize(card.textContent);
  const exact = posts.find((post) => post.caption && cardText.includes(normalize(post.caption)));
  if (exact) return exact;

  const authorName = normalize(card.querySelector("span")?.textContent);
  return posts.find((post) => {
    const name = normalize(post.author?.name);
    return name && authorName && (authorName.includes(name) || cardText.includes(name));
  }) || null;
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
      event.stopPropagation();
      try {
        const result = await sharePost(post._id);
        if (navigator.share) {
          await navigator.share({ title: "CampusMate post", text: post.caption || "CampusMate post", url: window.location.href }).catch(() => {});
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href).catch(() => {});
        }
        toast(`Shared${Number.isFinite(result?.sharesCount) ? ` · ${result.sharesCount}` : ""}`);
      } catch (error) {
        toast(error.response?.data?.message || "Could not share post", "error");
      }
    });
  }

  if (commentButton && !commentButton.dataset.cmComments) {
    commentButton.dataset.cmComments = "1";
    commentButton.addEventListener("click", async () => {
      try {
        const comments = await fetchComments(post._id);
        const count = Array.isArray(comments) ? comments.length : 0;
        const countNode = Array.from(commentButton.querySelectorAll("span")).find((s) => /^\d+$/.test(normalize(s.textContent)));
        if (countNode) countNode.textContent = String(count);
      } catch (_) {}
    });
  }

  if (moreButton.dataset.cmMenu === "1") return;
  moreButton.dataset.cmMenu = "1";
  moreButton.setAttribute("aria-label", "Post actions");

  moreButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const existing = card.querySelector(":scope > .cm-phase-c-menu");
    if (existing) {
      existing.remove();
      return;
    }

    closeMenus();
    const menu = document.createElement("div");
    menu.className = "cm-phase-c-menu";
    const dark = themeIsDark();
    Object.assign(menu.style, {
      position: "absolute", right: "12px", top: "54px", zIndex: "300",
      width: "172px", padding: "6px", borderRadius: "12px",
      background: dark ? "#15182a" : "#fff", color: dark ? "#f2f1fb" : "#14121f",
      border: dark ? "1px solid rgba(255,255,255,.12)" : "1px solid rgba(20,18,31,.10)",
      boxShadow: "0 18px 42px rgba(0,0,0,.28)"
    });

    const own = String(post.author?._id || post.author) === String(me?._id);
    if (own) {
      menu.appendChild(makeMenuButton("Delete post", async (e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this post?")) return;
        try {
          await deletePost(post._id);
          card.remove();
          closeMenus();
          toast("Post deleted");
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
          closeMenus();
          toast("Report submitted");
        } catch (error) {
          toast(error.response?.data?.message || "Could not report post", "error");
        }
      }, true));
    }

    menu.appendChild(makeMenuButton("Share", async (e) => {
      e.stopPropagation();
      try {
        await sharePost(post._id);
        closeMenus();
        toast("Post shared");
      } catch (error) {
        toast(error.response?.data?.message || "Could not share post", "error");
      }
    }));

    card.appendChild(menu);
  });
}

async function enhance() {
  if (!localStorage.getItem("cm_token")) return;
  try {
    const [me, first] = await Promise.all([
      fetchMe().catch(() => null),
      fetchFeed("For You", 1),
    ]);
    const posts = first?.posts || [];
    if (!posts.length) return;

    const moreButtons = findMoreButtons();
    moreButtons.forEach((moreButton) => {
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
      observer._timer = setTimeout(run, 180);
    });
    const root = document.getElementById("root");
    if (root) observer.observe(root, { childList: true, subtree: true });

    const changed = () => setTimeout(run, 180);
    window.addEventListener("cm-posts-changed", changed);
    window.addEventListener("cm-media-uploaded", changed);

    const outsideClick = (event) => {
      if (!event.target.closest?.(".cm-phase-c-menu") && !event.target.closest?.("button[data-cm-menu='1']")) closeMenus();
    };
    document.addEventListener("click", outsideClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("cm-posts-changed", changed);
      window.removeEventListener("cm-media-uploaded", changed);
      document.removeEventListener("click", outsideClick);
    };
  }, []);

  return null;
}
