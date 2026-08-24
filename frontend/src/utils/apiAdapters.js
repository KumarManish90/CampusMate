export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function createLiveUserCache() {
  const cache = {};

  const registerLiveUser = (apiUser) => {
    if (!apiUser?._id) return apiUser;
    const shaped = {
      id: apiUser._id,
      name: apiUser.name,
      age: null,
      branch: apiUser.branch || "",
      year: apiUser.year || "",
      college: apiUser.collegeName || apiUser.college || "Unknown",
      bio: apiUser.bio || "",
      interests: apiUser.interests || [],
      lookingFor: apiUser.lookingFor || "Networking",
      photoUrl: apiUser.profilePhoto?.url,
      verificationStatus: apiUser.verificationStatus,
    };
    cache[apiUser._id] = shaped;
    return shaped;
  };

  const byId = (id) => cache[id] || { id, name: "Unknown", college: "—", interests: [] };
  return { registerLiveUser, byId };
}

export function adaptApiPost(post, registerLiveUser) {
  const author = registerLiveUser(post?.author);
  return {
    id: post?._id,
    authorId: post?.author?._id,
    type: post?.type,
    caption: post?.caption || "",
    hashtags: post?.hashtags || [],
    likesCount: post?.likesCount ?? (post?.likes?.length || 0),
    commentsCount: post?.commentsCount || 0,
    savesCount: post?.savesCount || 0,
    createdAt: timeAgo(post?.createdAt),
    comments: [],
    media: post?.media,
    college: author?.college,
  };
}

export function adaptApiReel(reel, registerLiveUser) {
  const author = registerLiveUser(reel?.author);
  return {
    id: reel?._id,
    authorId: reel?.author?._id,
    caption: reel?.caption || "",
    audioName: reel?.audioName || "Original Audio",
    hashtags: reel?.hashtags || [],
    likesCount: reel?.likesCount ?? (reel?.likes?.length || 0),
    commentsCount: reel?.commentsCount || 0,
    views: reel?.viewsCount || 0,
    duration: reel?.duration,
    videoUrl: reel?.videoUrl,
    thumbnailUrl: reel?.thumbnailUrl,
    college: author?.college,
  };
}
