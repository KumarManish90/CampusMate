import { useCallback, useState } from "react";

/**
 * Owns the lightweight view/tab/navigation state used by the CampusMate root.
 * This keeps navigation transitions testable without moving presentation out
 * of the existing screen components.
 */
export function useAppNavigation(initialView = "landing", initialTab = "home") {
  const [view, setView] = useState(initialView);
  const [tab, setTab] = useState(initialTab);
  const [activeChat, setActiveChat] = useState(null);

  const openApp = useCallback(() => setView("app"), []);
  const openAuth = useCallback(() => setView("auth"), []);
  const openOnboarding = useCallback(() => setView("onboarding"), []);
  const openLanding = useCallback(() => setView("landing"), []);
  const openChat = useCallback((student) => setActiveChat(student), []);
  const closeChat = useCallback(() => setActiveChat(null), []);
  const goToTab = useCallback((nextTab) => setTab(nextTab), []);

  return {
    view,
    setView,
    tab,
    setTab,
    activeChat,
    setActiveChat,
    openApp,
    openAuth,
    openOnboarding,
    openLanding,
    openChat,
    closeChat,
    goToTab,
  };
}
