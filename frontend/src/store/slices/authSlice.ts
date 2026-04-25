// frontend/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { login, register, getMe, googleAuth } from "../../services/authService";

// ── Helper: extract a clean user-facing error message ────────────────────────
// Handles every failure mode: network down, bad URL, server error, timeout.
function extractError(error: any, fallback: string): string {
  // Server returned a proper error message
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error)   return error.response.data.error;

  // Axios timeout
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "The server took too long to respond. Please try again.";
  }

  // Network Error = axios could not reach the server at all.
  // This happens on Vercel when NEXT_PUBLIC_API_URL is not set.
  if (error.message?.includes("Network Error") || error.code === "ERR_NETWORK") {
    return "Could not connect to the server. Please try again in a moment.";
  }

  return fallback;
}

// ── Restore user from token on app load ──────────────────────────────────────
export const restoreUser = createAsyncThunk(
  "auth/restoreUser",
  async (_, { rejectWithValue }) => {
    try {
      if (typeof window === "undefined") return rejectWithValue("SSR");
      const token = localStorage.getItem("token");
      if (!token) return rejectWithValue("No token");
      const data = await getMe();
      return { user: data.user, token };
    } catch {
      if (typeof window !== "undefined") localStorage.removeItem("token");
      return rejectWithValue("Session expired");
    }
  }
);

// ── Email / password login ────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await login(email, password);
      if (typeof window !== "undefined") localStorage.setItem("token", data.token);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        extractError(error, "Login failed. Please check your credentials.")
      );
    }
  }
);

// ── Registration ──────────────────────────────────────────────────────────────
export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    { name, email, password, company }: { name: string; email: string; password: string; company: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await register(name, email, password, company);
      if (typeof window !== "undefined") localStorage.setItem("token", data.token);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        extractError(error, "Registration failed. Please try again.")
      );
    }
  }
);

// ── Google OAuth login ────────────────────────────────────────────────────────
export const loginWithGoogle = createAsyncThunk(
  "auth/googleLogin",
  async (
    { credential, company }: { credential: string; company?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await googleAuth(credential, company);
      if (typeof window !== "undefined") localStorage.setItem("token", data.token);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        extractError(error, "Google sign-in failed. Please try again.")
      );
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:      null as any,
    token:     null as string | null,
    loading:   false,
    restoring: true,
    error:     null as string | null,
  },
  reducers: {
    logout: (state) => {
      state.user      = null;
      state.token     = null;
      state.restoring = false;
      if (typeof window !== "undefined") localStorage.removeItem("token");
    },

    clearError: (state) => {
      state.error = null;
    },

    // Used by profile/page.tsx to update name/company in Redux after a save
    updateProfileFields: (
      state,
      action: PayloadAction<{ name?: string; company?: string }>
    ) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Generic user setter (used by some pages after auth restore)
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── restoreUser ──────────────────────────────────────────────────────────
    builder
      .addCase(restoreUser.pending, (state) => {
        state.restoring = true;
      })
      .addCase(restoreUser.fulfilled, (state, action) => {
        state.restoring = false;
        state.user      = action.payload.user;
        state.token     = action.payload.token;
      })
      .addCase(restoreUser.rejected, (state) => {
        state.restoring = false;
        state.user      = null;
        state.token     = null;
      });

    // ── loginUser ────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
        state.error   = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── registerUser ─────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
        state.error   = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── loginWithGoogle ──────────────────────────────────────────────────────
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user    = action.payload.user;
        state.token   = action.payload.token;
        state.error   = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const { logout, clearError, updateProfileFields, setUser } = authSlice.actions;
export default authSlice.reducer;