// frontend/src/services/api.ts
//
// Central axios instance used by every service in the app.
//
// The base URL is read from NEXT_PUBLIC_API_URL at build time.
// On Vercel this must be set as an environment variable — see README.
// Fallback is localhost:5000 for local development only.

import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "" // will produce a clear error rather than silently hitting localhost
    : "http://localhost:5000/api");

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 s — prevents requests hanging forever on bad URL
});

// ── Request: attach JWT from localStorage ────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 globally ───────────────────────────────────────────
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