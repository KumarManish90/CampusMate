import { useEffect, useState } from "react";
import { adaptApiPost, adaptApiReel, createLiveUserCache } from "../utils/apiAdapters";

/**
 * Loads live feed/reels when a real session exists while preserving the caller's
 * existing local demo state as the fallback. This keeps network concerns out of
 * the root app component.
 */
export function useCampusMateFeed({ api, enabled = false, initialPosts = [], initialReels = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [reels, setReels] = useState(initialReels);
  const [backendOnline, setBackendOnline] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    const liveUsers = createLiveUserCache();
    setLoading(true);

    Promise.allSettled([
      api.fetchFeed("For You"),
      api.fetchReels(undefined),
    ])
      .then(([feedResult, reelsResult]) => {
        if (!active) return;

        let hasLiveData = false;

        if (feedResult.status === "fulfilled" && feedResult.value?.posts?.length) {
          setPosts(feedResult.value.posts.map((post) => ({ ...adaptApiPost(post, liveUsers.registerLiveUser), liked: false, saved: false })));
          hasLiveData = true;
        }

        if (reelsResult.status === "fulfilled" && reelsResult.value?.length) {
          setReels(reelsResult.value.map((reel) => ({ ...adaptApiReel(reel, liveUsers.registerLiveUser), liked: false, saved: false })));
          hasLiveData = true;
        }

        setBackendOnline(hasLiveData || (feedResult.status === "fulfilled" || reelsResult.status === "fulfilled"));
      })
      .catch(() => {
        if (active) setBackendOnline(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, enabled]);

  return { posts, setPosts, reels, setReels, backendOnline, loading };
}
