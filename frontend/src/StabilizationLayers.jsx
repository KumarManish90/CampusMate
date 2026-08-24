import MediaUploadLayer from "./MediaUploadLayer.jsx";
import LiveMediaHydrator from "./LiveMediaHydrator.jsx";
import PhaseCPostLayer from "./PhaseCPostLayer.jsx";
import PhaseCPaginationLayer from "./PhaseCPaginationLayer.jsx";
import PhaseDReelsLayer from "./PhaseDReelsLayer.jsx";
import PhaseEStoriesLayer from "./PhaseEStoriesLayer.jsx";
import PhaseFProfileLayer from "./PhaseFProfileLayer.jsx";
import CreateMediaShortcutLayer from "./CreateMediaShortcutLayer.jsx";
import LiveChatLayer from "./LiveChatLayer.jsx";

/** Temporary compatibility boundary while the monolithic demo App is retired. */
export default function StabilizationLayers() {
  return <>
    <MediaUploadLayer />
    <LiveMediaHydrator />
    <PhaseCPostLayer />
    <PhaseCPaginationLayer />
    <PhaseDReelsLayer />
    <PhaseEStoriesLayer />
    <PhaseFProfileLayer />
    <LiveChatLayer />
    <CreateMediaShortcutLayer />
  </>;
}
