import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAllJobs,
  createJob,
  deleteJob,
  updateJob,
} from "../../services/jobService";

export const fetchJobs = createAsyncThunk(
  "jobs/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getAllJobs();
      return data.jobs;
    } catch (error: any) {
      return rejectWithValue("Failed to fetch jobs");
    }
  }
);

export const addJob = createAsyncThunk(
  "jobs/add",
  async (jobData: any, { rejectWithValue }) => {
    try {
      const data = await createJob(jobData);
      return data.job;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create job"
      );
    }
  }
);

export const removeJob = createAsyncThunk(
  "jobs/remove",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteJob(id);
      return id;
    } catch (error: any) {
      return rejectWithValue("Failed to delete job");
    }
  }
);

export const saveJob = createAsyncThunk(
  "jobs/update",
  async (
    { id, data }: { id: string; data: Record<string, unknown> },
    { rejectWithValue }
  ) => {
    try {
      const res = await updateJob(id, data);
      return res.job;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update job"
      );
    }
  }
);

const jobSlice = createSlice({
  name: "jobs",
  initialState: {
    jobs: [] as any[],
    currentJob: null as any,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    bumpJobApplicants: (state, action: { payload: { jobId: string; delta: number } }) => {
      const j = state.jobs.find((x) => x._id === action.payload.jobId);
      if (j) {
        j.applicantsCount = Math.max(
          0,
          (j.applicantsCount || 0) + action.payload.delta
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
      })
      .addCase(saveJob.fulfilled, (state, action) => {
        const idx = state.jobs.findIndex((j) => j._id === action.payload._id);
        if (idx >= 0) state.jobs[idx] = action.payload;
        if (state.currentJob?._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(removeJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter((j) => j._id !== action.payload);
      });
  },
});

export const { setCurrentJob, bumpJobApplicants } = jobSlice.actions;
export default jobSlice.reducer;