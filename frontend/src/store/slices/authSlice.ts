import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { login, register } from "../../services/authService";
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
    error: null as string | null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
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
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
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