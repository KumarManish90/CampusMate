import { useCallback, useState } from "react";

export function useCampusMateOverlays() {
  const [matchModal, setMatchModal] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [commentsReel, setCommentsReel] = useState(null);

  const openMatch = useCallback((student) => setMatchModal(student), []);
  const closeMatch = useCallback(() => setMatchModal(null), []);
  const openStory = useCallback((story) => setActiveStory(story), []);
  const closeStory = useCallback(() => setActiveStory(null), []);
  const toggleCreate = useCallback(() => setShowCreate((current) => !current), []);
  const toggleNotifs = useCallback(() => setShowNotifs((current) => !current), []);
  const openPostComments = useCallback((post) => setCommentsPost(post), []);
  const closePostComments = useCallback(() => setCommentsPost(null), []);
  const openReelComments = useCallback((reel) => setCommentsReel(reel), []);
  const closeReelComments = useCallback(() => setCommentsReel(null), []);

  return {
    matchModal,
    setMatchModal,
    activeStory,
    setActiveStory,
    showCreate,
    setShowCreate,
    showNotifs,
    setShowNotifs,
    commentsPost,
    setCommentsPost,
    commentsReel,
    setCommentsReel,
    openMatch,
    closeMatch,
    openStory,
    closeStory,
    toggleCreate,
    toggleNotifs,
    openPostComments,
    closePostComments,
    openReelComments,
    closeReelComments,
  };
}
