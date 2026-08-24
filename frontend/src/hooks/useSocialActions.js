import { useCallback } from "react";

/**
 * Shared social interactions used by the root app shell.
 * State ownership stays in the caller; this hook only coordinates updates
 * and optional backend calls.
 */
export function useSocialActions({
  authUser,
  api,
  following,
  setPosts,
  setReels,
  setFollowing,
  setMatches,
  setMatchModal,
  userId = 1,
}) {
  const handleMatch = useCallback((student) => {
    setMatches((current) => (
      current.find((item) => item.id === student.id)
        ? current
        : [student, ...current]
    ));
    setMatchModal(student);
    if (authUser) api.swipe(student.id, "like").catch(() => {});
  }, [api, authUser, setMatchModal, setMatches]);

  const toggleFollow = useCallback((id) => {
    const isFollowing = following.includes(id);
    const next = isFollowing
      ? following.filter((item) => item !== id)
      : [...following, id];

    setFollowing(next);

    if (authUser) {
      const request = isFollowing ? api.unfollowUser(id) : api.followUser(id);
      request.catch(() => {});
    }
  }, [api, authUser, following, setFollowing]);

  const likePost = useCallback((id) => {
    setPosts((current) => current.map((post) => (
      post.id === id
        ? { ...post, liked: !post.liked, likesCount: post.likesCount + (post.liked ? -1 : 1) }
        : post
    )));
    if (authUser) api.likePost(id).catch(() => {});
  }, [api, authUser, setPosts]);

  const savePost = useCallback((id) => {
    setPosts((current) => current.map((post) => (
      post.id === id ? { ...post, saved: !post.saved } : post
    )));
    if (authUser) api.savePost(id).catch(() => {});
  }, [api, authUser, setPosts]);

  const addComment = useCallback((postId, text) => {
    setPosts((current) => current.map((post) => (
      post.id === postId
        ? {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [
              ...(post.comments || []),
              { id: `c${Date.now()}`, authorId: userId, text, time: "now" },
            ],
          }
        : post
    )));
    if (authUser) api.addComment(postId, text).catch(() => {});
  }, [api, authUser, setPosts, userId]);

  const likeReel = useCallback((id) => {
    setReels((current) => current.map((reel) => (
      reel.id === id
        ? { ...reel, liked: !reel.liked, likesCount: reel.likesCount + (reel.liked ? -1 : 1) }
        : reel
    )));
    if (authUser) api.likeReel(id).catch(() => {});
  }, [api, authUser, setReels]);

  const saveReel = useCallback((id) => {
    setReels((current) => current.map((reel) => (
      reel.id === id ? { ...reel, saved: !reel.saved } : reel
    )));
  }, [setReels]);

  const viewReel = useCallback((id) => {
    setReels((current) => current.map((reel) => (
      reel.id === id ? { ...reel, views: reel.views + 1 } : reel
    )));
    if (authUser) api.registerReelView(id).catch(() => {});
  }, [api, authUser, setReels]);

  return {
    handleMatch,
    toggleFollow,
    likePost,
    savePost,
    addComment,
    likeReel,
    saveReel,
    viewReel,
  };
}
