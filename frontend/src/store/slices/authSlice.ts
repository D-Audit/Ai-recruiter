import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { login, register, getMe } from "../../services/authService";

// ── Restore user from token on app load (called in providers.tsx) ──
export const restoreUser = createAsyncThunk(
  "auth/restoreUser",
  async (_, { rejectWithValue }) => {
    try {
      // Only run on client where localStorage is available
      if (typeof window === "undefined") return rejectWithValue("SSR");
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("No token");
      const data = await getMe();
      return { user: data.user, token };
    } catch {
      // Token invalid/expired — clear it
      if (typeof window !== "undefined") localStorage.removeItem("token");
      return rejectWithValue("Session expired");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await login(email, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
      company,
    }: {
      name: string;
      email: string;
      password: string;
      company: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const data = await register(name, email, password, company);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null as any,
    token: null as string | null,
    loading: false,
    restoring: true,   // true on first load — prevents flash of "User"
    error: null as string | null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.restoring = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProfileFields: (
      state,
      action: PayloadAction<{ name?: string; company?: string }>
    ) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── restoreUser ──────────────────────────────────────────────
      .addCase(restoreUser.pending, (state) => {
        state.restoring = true;
      })
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.restoring = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(restoreUser.rejected, (state) => {
        state.restoring = false;
        state.user = null;
        state.token = null;
      })
      // ── loginUser ────────────────────────────────────────────────
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.restoring = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ── registerUser ─────────────────────────────────────────────
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.restoring = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, updateProfileFields } = authSlice.actions;
export default authSlice.reducer;