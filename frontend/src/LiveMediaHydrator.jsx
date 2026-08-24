import { useEffect } from "react";
import { fetchFeed } from "./api/client";

function mountMedia(box, media, type) {
  if (!box || !media?.url || box.dataset.cmLiveMedia === "1") return;
  box.dataset.cmLiveMedia = "1";
  box.innerHTML = "";
  box.style.background = "#05060c";

  const el = type === "video" ? document.createElement("video") : document.createElement("img");
  el.src = media.url;
  el.alt = "CampusMate post media";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.objectFit = "cover";
  el.style.display = "block";
  el.setAttribute("playsinline", "true");
  if (type === "video") {
    el.muted = true;
    el.controls = true;
    el.loop = true;
  }
  el.onerror = () => {
    box.dataset.cmLiveMedia = "";
  };
  box.appendChild(el);
}

export default function LiveMediaHydrator() {
  useEffect(() => {
    let cancelled = false;
    let observer;

    const hydrate = async () => {
      const token = localStorage.getItem("cm_token");
      if (!token) return;

      try {
        const data = await fetchFeed("For You", 1);
        if (cancelled) return;

        const mediaPosts = (data?.posts || []).filter((post) => Array.isArray(post.media) && post.media.length && post.type !== "text");
        if (!mediaPosts.length) return;

        const apply = () => {
          const boxes = Array.from(document.querySelectorAll('.cm-root div[style*="height: 300px"]'))
            .filter((box) => !box.dataset.cmLiveMedia && box.querySelector("svg"));
          mediaPosts.forEach((post, index) => {
            const box = boxes[index];
            if (!box) return;
            const media = post.media[0];
            mountMedia(box, media, media?.mimeType?.startsWith("video/") ? "video" : "image");
          });
        };

        apply();
        observer = new MutationObserver(apply);
        observer.observe(document.body, { childList: true, subtree: true });
      } catch (_) {
        // Keep the existing UI unchanged when the live feed is temporarily unavailable.
      }
    };

    hydrate();
    const refresh = () => hydrate();
    window.addEventListener("cm-media-uploaded", refresh);
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("cm-media-uploaded", refresh);
    };
  }, []);

  return null;
}
