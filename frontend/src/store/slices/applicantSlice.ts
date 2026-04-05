import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getApplicants,
  getUmuravaProfiles,
} from "../../services/applicantService";

export const fetchApplicants = createAsyncThunk(
  "applicants/fetch",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const data = await getApplicants(jobId);
      return data.applicants;
    } catch (error: any) {
      return rejectWithValue("Failed to fetch applicants");
    }
  }
);

export const fetchUmuravaProfiles = createAsyncThunk(
  "applicants/umurava",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getUmuravaProfiles();
      return data.profiles;
    } catch (error: any) {
      return rejectWithValue("Failed to fetch profiles");
    }
  }
);

const applicantSlice = createSlice({
  name: "applicants",
  initialState: {
    applicants: [] as any[],
    umuravaProfiles: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.applicants = action.payload;
      })
      .addCase(fetchApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUmuravaProfiles.fulfilled, (state, action) => {
        state.umuravaProfiles = action.payload;
      });
  },
});

export default applicantSlice.reducer;