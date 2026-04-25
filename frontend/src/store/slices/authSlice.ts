// frontend/src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { login, register, getMe, googleAuth } from "../../services/authService";

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
        error.response?.data?.message || "Login failed. Please check your credentials."
      );
    }
  }
);

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
        error.response?.data?.message || "Registration failed. Please try again."
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
      const msg =
        error.response?.data?.message ||
        (error.message?.includes("Network Error")
          ? "Cannot reach the server. Check that NEXT_PUBLIC_API_URL is set correctly in Vercel."
          : "Google sign-in failed. Please try again.");
      return rejectWithValue(msg);
    }
  }
);

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
    // ── restoreUser ──
    builder
      .addCase(restoreUser.pending,   (state) => { state.restoring = true; })
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

    // ── loginUser ──
    builder
      .addCase(loginUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading   = false;
        state.restoring = false;
        state.user      = action.payload.user;
        state.token     = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── registerUser ──
    builder
      .addCase(registerUser.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading   = false;
        state.restoring = false;
        state.user      = action.payload.user;
        state.token     = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });

    // ── loginWithGoogle ──
    builder
      .addCase(loginWithGoogle.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading   = false;
        state.restoring = false;
        state.user      = action.payload.user;
        state.token     = action.payload.token;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const { logout, clearError, updateProfileFields, setUser } = authSlice.actions;
export default authSlice.reducer;