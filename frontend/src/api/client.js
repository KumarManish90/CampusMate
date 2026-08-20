/**
 * Central Axios client for the CampusMate backend.
 *
 * The App.jsx shipped in this folder is still the Phase-1/2 UI prototype —
 * it holds posts/reels/matches in local React state so the interface can be
 * demoed instantly. Wiring it to this real backend is a mechanical, page-by-page
 * job: swap each `useState(DEMO_DATA)` for a `useEffect` that calls the matching
 * function below, and swap each local mutation (`setPosts(...)`) for the
 * matching POST/DELETE call followed by a state refresh. That work is not done
 * in this pass — see the "Frontend integration" section of the root README.
 */
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    }
    return Promise.reject(err);
  }
);

// ---- Colleges (multi-college support — search or add, never hardcoded) ----
export const searchColleges = (q) => api.get("/colleges", { params: { search: q } }).then((r) => r.data.colleges);
export const addCollege = (payload) => api.post("/colleges", payload).then((r) => r.data.college);

// ---- Auth ----
export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data.user);

// ---- Feed / Posts ----
export const fetchFeed = (filter, page = 1) =>
  api.get("/feed", { params: { filter, page } }).then((r) => r.data);
export const createPost = (formData) =>
  api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data.post);
export const likePost = (id) => api.post(`/posts/${id}/like`).then((r) => r.data);
export const savePost = (id) => api.post(`/posts/${id}/save`).then((r) => r.data);
export const fetchComments = (postId) => api.get(`/posts/${postId}/comments`).then((r) => r.data.comments);
export const addComment = (postId, text) => api.post(`/posts/${postId}/comments`, { text }).then((r) => r.data.comment);

// ---- Reels ----
export const fetchReels = (college, page = 1) =>
  api.get("/reels", { params: { college, page } }).then((r) => r.data.reels);
export const fetchTrendingReels = () => api.get("/reels/trending").then((r) => r.data.reels);
export const likeReel = (id) => api.post(`/reels/${id}/like`).then((r) => r.data);
export const registerReelView = (id) => api.post(`/reels/${id}/view`).then((r) => r.data);

// ---- Stories ----
export const fetchStories = () => api.get("/stories").then((r) => r.data.stories);
export const viewStory = (id) => api.post(`/stories/${id}/view`).then((r) => r.data);

// ---- Discovery / Matching ----
export const fetchDiscoverCandidates = (college) =>
  api.get("/discover", { params: { college } }).then((r) => r.data.candidates);
export const swipe = (to, action) => api.post("/swipes", { to, action }).then((r) => r.data);
export const fetchMatches = () => api.get("/matches").then((r) => r.data.matches);

// ---- Messages (history over REST; live delivery over Socket.IO — see src/socket.js) ----
export const fetchMessages = (matchId) => api.get(`/messages/${matchId}`).then((r) => r.data.messages);

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

// ---- Profile photo ----
export const uploadProfilePhoto = (userId, file) => {
  const form = new FormData();
  form.append("photo", file);
  return api.post(`/users/${userId}/photo`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};
