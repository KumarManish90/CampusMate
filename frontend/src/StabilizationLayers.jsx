import MediaUploadLayer from "./MediaUploadLayer.jsx";
import LiveMediaHydrator from "./LiveMediaHydrator.jsx";
import PhaseCPostLayer from "./PhaseCPostLayer.jsx";
import PhaseCPaginationLayer from "./PhaseCPaginationLayer.jsx";
import PhaseDReelsLayer from "./PhaseDReelsLayer.jsx";
import PhaseEStoriesLayer from "./PhaseEStoriesLayer.jsx";
import PhaseFProfileLayer from "./PhaseFProfileLayer.jsx";
import CreateMediaShortcutLayer from "./CreateMediaShortcutLayer.jsx";

/**
 * Temporary compatibility boundary while App.jsx is migrated from seeded/demo
 * state to backend-driven React state. Keeping all compatibility layers behind
 * one component prevents new code from depending on DOM-injection layers and
 * gives us a single place to retire them as each native feature lands.
 */
export default function StabilizationLayers() {
  return (
    <>
      <MediaUploadLayer />
      <LiveMediaHydrator />
      <PhaseCPostLayer />
      <PhaseCPaginationLayer />
      <PhaseDReelsLayer />
      <PhaseEStoriesLayer />
      <PhaseFProfileLayer />
      <CreateMediaShortcutLayer />
    </>
  );
}
