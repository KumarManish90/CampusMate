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

function cloneOption(source, label, marker, ariaLabel, proxyLabel) {
  const option = source.cloneNode(true);
  option.dataset[marker] = "1";
  const textNodes = Array.from(option.querySelectorAll("span,div"));
  const labelNode = textNodes.find((node) => node.textContent?.trim() === source.textContent?.trim()) || textNodes.find((node) => node.textContent?.trim() === "Photo Post");
  if (labelNode) labelNode.textContent = label;
  else option.textContent = label;
  option.setAttribute("aria-label", ariaLabel);
  option.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); proxyMediaClick(proxyLabel); });
  return option;
}

function ensureCreateMediaOptions() {
  const buttons = Array.from(document.querySelectorAll("button"));
  const photo = buttons.find((b) => b.textContent?.trim() === "Photo Post");
  if (!photo) return;
  const container = photo.parentElement;
  if (!container) return;
  let reel = Array.from(container.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Reel");
  if (!reel) { reel = cloneOption(photo, "Reel", "cmInjectedReel", "Create Reel", "Reel"); if (photo.nextSibling) container.insertBefore(reel, photo.nextSibling); else container.appendChild(reel); }
  const hasStory = Array.from(container.querySelectorAll("button")).some((b) => b.textContent?.trim() === "Story");
  if (!hasStory) { const story = cloneOption(photo, "Story", "cmInjectedStory", "Create Story", "Your Story"); if (reel.nextSibling) container.insertBefore(story, reel.nextSibling); else container.appendChild(story); }
}

function bindYourStoryPlus() {
  const label = Array.from(document.querySelectorAll("span")).find((el) => el.textContent?.trim() === "Your Story");
  if (!label) return;
  const card = label.parentElement;
  const circle = card?.firstElementChild;
  if (!circle || circle.dataset.cmPlusBound === "1") return;
  circle.dataset.cmPlusBound = "1";
  const plus = Array.from(circle.querySelectorAll("div")).find((el) => el.querySelector("svg") && el.getBoundingClientRect().width <= 28);
  if (!plus) return;
  plus.style.cursor = "pointer";
  plus.dataset.cmStoryPlus = "1";
  plus.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); proxyMediaClick("Your Story"); }, true);
}

export default function CreateMediaShortcutLayer() {
  useEffect(() => {
    const sync = () => { ensureCreateMediaOptions(); bindYourStoryPlus(); };
    sync();
    const observer = new MutationObserver(() => { clearTimeout(observer._cmTimer); observer._cmTimer = setTimeout(sync, 40); });
    observer.observe(document.body, { childList: true, subtree: true });
    const onClickCapture = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const button = target.closest("button");
      if (button && button.dataset.cmMediaProxy !== "1" && button.dataset.cmInjectedReel !== "1" && button.dataset.cmInjectedStory !== "1") {
        const label = button.textContent?.replace(/\s+/g, " ").trim() || "";
        if (label === "Reel") { event.preventDefault(); event.stopPropagation(); proxyMediaClick("Reel"); return; }
        if (label === "Story") { event.preventDefault(); event.stopPropagation(); proxyMediaClick("Your Story"); }
      }
    };
    document.addEventListener("click", onClickCapture, true);
    return () => { observer.disconnect(); document.removeEventListener("click", onClickCapture, true); };
  }, []);
  return null;
}
