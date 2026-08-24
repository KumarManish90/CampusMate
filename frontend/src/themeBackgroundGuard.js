// Keep the browser page background in sync with CampusMate's active theme.
// This prevents mobile overscroll/bounce areas from exposing the browser's
// default white background below the app content.
export function installThemeBackgroundGuard() {
  const sync = () => {
    const app = document.querySelector(".cm-root");
    if (!app) return;

    const background = getComputedStyle(app).backgroundColor || "#0A0D1A";
    const doc = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    doc.style.backgroundColor = background;
    body.style.backgroundColor = background;
    if (root) root.style.backgroundColor = background;
  };

  const start = () => sync();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });

  return () => observer.disconnect();
}
