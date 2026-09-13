import { useEffect } from "react";

/**
 * Keeps authentication/session bootstrapping outside the root app component.
 * The callback owns app-specific state updates so this hook stays reusable.
 */
export function useCampusMateSession({ api, onUser, onBackendStatus, onSessionState }) {
  useEffect(() => {
    const token = localStorage.getItem("cm_token");

    if (!token) {
      onSessionState?.({ checking: false });
      return undefined;
    }

    let active = true;
    onSessionState?.({ checking: true });

    api.fetchMe()
      .then((user) => {
        if (!active) return;
        onUser?.(user);
        onBackendStatus?.(true);
        onSessionState?.({ checking: false, authenticated: true });
      })
      .catch((err) => {
        if (!active) return;
        const reachable = Boolean(err?.response);
        onBackendStatus?.(reachable);
        if (reachable) localStorage.removeItem("cm_token");
        onSessionState?.({ checking: false, authenticated: false });
      });

    return () => {
      active = false;
    };
  }, [api, onBackendStatus, onSessionState, onUser]);
}
