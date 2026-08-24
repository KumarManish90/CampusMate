import { useEffect } from "react";

function proxyMediaClick(label) {
  const proxy = document.createElement("button");
  proxy.type = "button";
  proxy.dataset.cmMediaProxy = "1";
  proxy.textContent = label;
  proxy.style.display = "none";
  document.body.appendChild(proxy);
  proxy.click();
  proxy.remove();
}

function ensureReelOption() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const photo = buttons.find((b) => b.textContent?.trim() === "Photo Post");
  if (!photo) return;

  const container = photo.parentElement;
  if (!container) return;
  const hasReel = Array.from(container.querySelectorAll("button")).some((b) => b.textContent?.trim() === "Reel");
  if (hasReel) return;

  const reel = photo.cloneNode(true);
  reel.dataset.cmInjectedReel = "1";
  reel.removeAttribute("key");

  const textNodes = Array.from(reel.querySelectorAll("span,div"));
  const labelNode = textNodes.find((node) => node.textContent?.trim() === "Photo Post");
  if (labelNode) labelNode.textContent = "Reel";
  else reel.textContent = "Reel";

  reel.setAttribute("aria-label", "Create Reel");
  reel.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    proxyMediaClick("Reel");
  });

  if (photo.nextSibling) container.insertBefore(reel, photo.nextSibling);
  else container.appendChild(reel);
}

export default function CreateMediaShortcutLayer() {
  useEffect(() => {
    const sync = () => ensureReelOption();
    sync();

    const observer = new MutationObserver(() => {
      clearTimeout(observer._cmTimer);
      observer._cmTimer = setTimeout(sync, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onClickCapture = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const button = target.closest("button");
      if (!button || button.dataset.cmMediaProxy === "1" || button.dataset.cmInjectedReel === "1") return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";

      // Clicking anywhere on an existing Reel option should open the real uploader,
      // not the old demo composer.
      if (label === "Reel") {
        event.preventDefault();
        event.stopPropagation();
        proxyMediaClick("Reel");
        return;
      }

      // The + badge inside Your Story is the direct upload affordance.
      if (label.includes("Your Story")) {
        const clickedPlus = !!target.closest("svg") || target.textContent?.trim() === "+";
        if (clickedPlus) {
          event.preventDefault();
          event.stopPropagation();
          proxyMediaClick("Your Story");
        }
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return null;
}
