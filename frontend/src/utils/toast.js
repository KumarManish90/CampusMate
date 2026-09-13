export const CAMPUSMATE_TOAST_EVENT = "cm-toast";

export function showToast(message, type = "success") {
  if (!message || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CAMPUSMATE_TOAST_EVENT, {
    detail: { message: String(message), type },
  }));
}
