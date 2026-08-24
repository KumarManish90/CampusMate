// Keep the browser page background in sync with CampusMate's active theme.
// This prevents mobile overscroll/bounce and long pages from exposing the
// browser's default white canvas below/behind the app.
export function installThemeBackgroundGuard() {
  let appObserver = null;

  const getAppShell = () => {
    const root = document.getElementById("root");
    return document.querySelector(".cm-root") || root?.firstElementChild || null;
  };

  const sync = () => {
    const app = getAppShell();
    if (!app) return;

    const computed = getComputedStyle(app);
    const background = computed.backgroundColor && computed.backgroundColor !== "rgba(0, 0, 0, 0)"
      ? computed.backgroundColor
      : "#0A0D1A";

    const doc = document.documentElement;
    const body = document.body;

    doc.style.setProperty("--cm-page-bg", background);
    doc.style.backgroundColor = background;
    body.style.backgroundColor = background;

    // Watch the actual shell because its inline background changes when the
    // user toggles dark/light mode.
    if (!appObserver) {
      appObserver = new MutationObserver(sync);
      appObserver.observe(app, { attributes: true, attributeFilter: ["style"] });
    }
  };

  const start = () => {
    sync();
    // React may mount just after this module runs, especially on slower phones.
    requestAnimationFrame(sync);
    setTimeout(sync, 120);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  return () => appObserver?.disconnect();
}
