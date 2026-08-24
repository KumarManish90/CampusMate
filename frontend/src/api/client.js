/**
 * Central Axios client for the CampusMate backend.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://campusmate-87k6.onrender.com/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cm_token");
      window.dispatchEvent(new CustomEvent("cm-auth-expired"));
    }
    return Promise.reject(err);
  }
);

// ---- Colleges ----
export const searchColleges = (q) => api.get("/colleges", { params: { search: q } }).then((r) => r.data.colleges);
export const addCollege = (payload) => api.post("/colleges", payload).then((r) => r.data.college);

// ---- Auth ----
export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data.user);

// ---- Feed / Posts ----
export const fetchFeed = (filter, page = 1) => api.get("/feed", { params: { filter, page } }).then((r) => r.data);
export const fetchPost = (id) => api.get(`/posts/${id}`).then((r) => r.data.post);
export const createPost = (formData) => api.post("/posts", formData).then((r) => r.data.post);
export const likePost = (id) => api.post(`/posts/${id}/like`).then((r) => r.data);
export const savePost = (id) => api.post(`/posts/${id}/save`).then((r) => r.data);
export const sharePost = (id) => api.post(`/posts/${id}/share`).then((r) => r.data);
export const fetchComments = (postId) => api.get(`/posts/${postId}/comments`).then((r) => r.data.comments);
export const addComment = (postId, text) => api.post(`/posts/${postId}/comments`, { text }).then((r) => r.data.comment);
export const deletePost = (id) => api.delete(`/posts/${id}`).then((r) => r.data);
export const reportPost = (id, reason, details = "") => api.post("/reports", { targetType: "post", targetId: id, reason, details }).then((r) => r.data.report);

// ---- Reels ----
export const fetchReels = (college, page = 1) => api.get("/reels", { params: { college, page } }).then((r) => r.data.reels);
export const fetchTrendingReels = () => api.get("/reels/trending").then((r) => r.data.reels);
export const createReel = (formData) => api.post("/reels", formData).then((r) => r.data.reel);
export const uploadReelThumbnail = (id, file) => { const form = new FormData(); form.append("thumbnail", file); return api.post(`/reels/${id}/thumbnail`, form).then((r) => r.data.reel); };
export const likeReel = (id) => api.post(`/reels/${id}/like`).then((r) => r.data);
export const saveReel = (id) => api.post(`/reels/${id}/save`).then((r) => r.data);
export const registerReelView = (id) => api.post(`/reels/${id}/view`).then((r) => r.data);
export const deleteReel = (id) => api.delete(`/reels/${id}`).then((r) => r.data);

// ---- Stories ----
export const fetchStories = () => api.get("/stories").then((r) => r.data.stories);
export const createStory = (formData) => api.post("/stories", formData).then((r) => r.data.story);
export const viewStory = (id) => api.post(`/stories/${id}/view`).then((r) => r.data);
export const deleteStory = (id) => api.delete(`/stories/${id}`).then((r) => r.data);

// ---- Discovery / Matching ----
export const fetchDiscoverCandidates = (college) => api.get("/discover", { params: { college } }).then((r) => r.data.candidates);
export const swipe = (to, action) => api.post("/swipes", { to, action }).then((r) => r.data);
export const fetchMatches = () => api.get("/matches").then((r) => r.data.matches);

// ---- Messages ----
export const fetchMessages = (matchId, page = 1) => api.get(`/messages/${matchId}`, { params: { page } }).then((r) => r.data.messages);
export const sendMessage = (matchId, text) => api.post("/messages", { matchId, text }).then((r) => r.data.message);

// ---- Explore / Clubs / Events / Search ----
export const fetchClubs = (college) => api.get("/clubs", { params: { college } }).then((r) => r.data.clubs);
export const joinClub = (id) => api.post(`/clubs/${id}/join`).then((r) => r.data.club);
export const fetchEvents = (college) => api.get("/events", { params: { college } }).then((r) => r.data.events);
export const registerForEvent = (id) => api.post(`/events/${id}/register`).then((r) => r.data.event);
export const search = (q) => api.get("/search", { params: { q } }).then((r) => r.data);

// ---- Notifications ----
export const fetchNotifications = () => api.get("/notifications").then((r) => r.data.notifications);

// ---- Follow ----
export const followUser = (id) => api.post(`/users/${id}/follow`).then((r) => r.data);
export const unfollowUser = (id) => api.delete(`/users/${id}/follow`).then((r) => r.data);

// ---- Profile ----
export const updateUserProfile = (userId, payload) => api.put(`/users/${userId}`, payload).then((r) => r.data.user);
export const fetchUserPosts = (userId) => api.get(`/users/${userId}/posts`).then((r) => r.data.posts);
export const fetchUserReels = (userId) => api.get(`/users/${userId}/reels`).then((r) => r.data.reels);
export const fetchSavedContent = (userId) => api.get(`/users/${userId}/saved`).then((r) => r.data);
export const uploadProfilePhoto = (userId, file) => { const form = new FormData(); form.append("photo", file); return api.post(`/users/${userId}/photo`, form).then((r) => r.data); };
export const removeProfilePhoto = (userId) => api.delete(`/users/${userId}/photo`).then((r) => r.data.user);
