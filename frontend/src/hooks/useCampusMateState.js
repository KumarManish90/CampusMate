import { useCampusMateOverlays } from "./useCampusMateOverlays";
import { useCampusMateProfile } from "./useCampusMateProfile";
import { useAppNavigation } from "./useAppNavigation";

/**
 * Unified UI-state facade for the CampusMate root.
 * Keeps navigation, profile, and overlay ownership together so App.jsx can
 * consume one hook instead of declaring unrelated state buckets inline.
 */
export function useCampusMateState(options = {}) {
  const navigation = useAppNavigation(options.initialView, options.initialTab);
  const profileState = useCampusMateProfile(options.initialProfile);
  const overlays = useCampusMateOverlays();

  return {
    ...navigation,
    ...profileState,
    ...overlays,
  };
}
