// frontend/src/services/authService.ts
import api from "./api";

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  company: string
) => {
  const res = await api.post("/auth/register", { name, email, password, company });
  return res.data;
};

/**
 * Google Sign-In — sends the Google credential token to backend.
 * The backend verifies it with Google and returns a JWT.
 */
export const googleAuth = async (credential: string, company?: string) => {
  const res = await api.post("/auth/google", { credential, company });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const updateProfile = async (data: { name?: string; company?: string }) => {
  const res = await api.put("/auth/profile", data);
  return res.data;
};

/**
 * Alias for updateProfile — used by profile/page.tsx.
 * Both names call the same endpoint.
 */
export const updateMe = async (data: { name?: string; company?: string }) => {
  return updateProfile(data);
};

/**
 * Change password — used by settings/page.tsx.
 * Calls PUT /auth/password on the backend.
 */
export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const res = await api.put("/auth/password", data);
  return res.data;
};

export const requestPasswordReset = async (email: string) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (token: string, password: string) => {
  const res = await api.post(`/auth/reset-password/${token}`, { password });
  return res.data;
};
