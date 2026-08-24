import { useCallback, useState } from "react";
import { useCampusMateSession } from "./useCampusMateSession";
import { useCampusMateFeed } from "./useCampusMateFeed";
import { useCampusMateState } from "./useCampusMateState";
import { useSocialActions } from "./useSocialActions";

export function useCampusMateRoot({ api, initialPosts = [], initialReels = [], initialProfile = {} } = {}) {
  const ui = useCampusMateState({ initialProfile });
  const [authUser, setAuthUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const [matches, setMatches] = useState([]);
  const [following, setFollowing] = useState([1, 5]);

  const onUser = useCallback((user) => {
    setAuthUser(user);
    ui.mergeProfile({
      name: user?.name || ui.profile.name,
      college: user?.college || ui.profile.college,
      branch: user?.branch || "",
      year: user?.year || "",
      bio: user?.bio || "",
      interests: user?.interests || [],
      lookingFor: user?.lookingFor || "",
    });
    ui.openApp();
  }, [ui.mergeProfile, ui.openApp, ui.profile.college, ui.profile.name]);

  const onSessionState = useCallback(({ checking, authenticated: nextAuthenticated }) => {
    if (typeof checking === "boolean") setCheckingSession(checking);
    if (typeof nextAuthenticated === "boolean") setAuthenticated(nextAuthenticated);
  }, []);

  useCampusMateSession({
    api,
    onUser,
    onBackendStatus: setBackendOnline,
    onSessionState,
  });

  const feed = useCampusMateFeed({
    api,
    enabled: ui.view === "app" && Boolean(authUser),
    initialPosts,
    initialReels,
  });

  const social = useSocialActions({
    authUser,
    api,
    setPosts: feed.setPosts,
    setReels: feed.setReels,
    setFollowing,
    setMatches,
    setMatchModal: ui.setMatchModal,
    userId: authUser?._id || 1,
  });

  const publishPost = useCallback(({ type, caption }) => {
    feed.setPosts((current) => [{
      id: `p${Date.now()}`,
      authorId: authUser?._id || 1,
      type,
      caption,
      hashtags: ["#CampusLife"],
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      createdAt: "just now",
      comments: [],
      liked: false,
      saved: false,
    }, ...current]);
  }, [authUser, feed.setPosts]);

  return {
    ...ui,
    authUser,
    setAuthUser,
    checkingSession,
    authenticated,
    backendOnline: feed.backendOnline ?? backendOnline,
    matches,
    following,
    setFollowing,
    posts: feed.posts,
    setPosts: feed.setPosts,
    reels: feed.reels,
    setReels: feed.setReels,
    feedLoading: feed.loading,
    ...social,
    publishPost,
  };
}
