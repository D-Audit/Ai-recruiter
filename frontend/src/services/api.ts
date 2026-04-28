// frontend/src/services/api.ts

import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? ""
    : "http://localhost:5000/api");

// Default instance — 20s timeout for all normal requests
const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 globally ────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Screening-specific axios instance with a 3-minute timeout.
 * AI screening can take 25-60 seconds for a batch of candidates.
 * The default 15/20s timeout kills these requests before they finish.
 */
export const screeningApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 180000, // 3 minutes — enough for 20 candidates + retries
});

// Attach JWT to screening requests too
screeningApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

screeningApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);