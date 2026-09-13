import { useEffect, useState } from "react";
import { adaptApiPost, adaptApiReel, createLiveUserCache } from "../utils/apiAdapters";

/**
 * Loads the optional live feed/reels without replacing the local demo fallback.
 * Consumers decide how/when to merge the returned data into their UI state.
 */
export function useLiveSocialFeed({ api, enabled = false, feedFilter = "For You" }) {
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    const userCache = createLiveUserCache();
    setLoading(true);
    setError(null);

    Promise.allSettled([
      api.fetchFeed(feedFilter),
      api.fetchReels(undefined),
    ])
      .then(([feedResult, reelsResult]) => {
        if (!active) return;

        if (feedResult.status === "fulfilled") {
          const rawPosts = feedResult.value?.posts || [];
          setPosts(rawPosts.map((post) => ({
            ...adaptApiPost(post, userCache.registerLiveUser),
            liked: false,
            saved: false,
          })));
        }

        if (reelsResult.status === "fulfilled") {
          const rawReels = reelsResult.value || [];
          setReels(rawReels.map((reel) => ({
            ...adaptApiReel(reel, userCache.registerLiveUser),
            liked: false,
            saved: false,
          })));
        }

        const failures = [feedResult, reelsResult].filter((result) => result.status === "rejected");
        if (failures.length === 2) setError(failures[0].reason || new Error("Live social feed unavailable"));
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [api, enabled, feedFilter]);

  return { posts, reels, loading, error };
}
