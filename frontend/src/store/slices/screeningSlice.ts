import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  runScreening,
  getResults,
  compareCandidates,
} from "../../services/screeningService";

export const triggerScreening = createAsyncThunk(
  "screening/run",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const data = await runScreening(jobId);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Screening failed"
      );
    }
  }
);

export const fetchResults = createAsyncThunk(
  "screening/results",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const data = await getResults(jobId);
      return data.data;
    } catch (error: any) {
      return rejectWithValue("Failed to get results");
    }
  }
);

export const compareSelected = createAsyncThunk(
  "screening/compare",
  async (
    { jobId, candidateIds }: { jobId: string; candidateIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const data = await compareCandidates(jobId, candidateIds);
      return data.data;
    } catch (error: any) {
      return rejectWithValue("Comparison failed");
    }
  }
);

const screeningSlice = createSlice({
  name: "screening",
  initialState: {
    results: null as any,
    comparison: null as any,
    selectedForCompare: [] as string[],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    toggleSelectForCompare: (state, action) => {
      const id = action.payload;
      if (state.selectedForCompare.includes(id)) {
        state.selectedForCompare = state.selectedForCompare.filter(
          (i) => i !== id
        );
      } else if (state.selectedForCompare.length < 3) {
        state.selectedForCompare.push(id);
      }
    },
    clearComparison: (state) => {
      state.comparison = null;
      state.selectedForCompare = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerScreening.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerScreening.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(triggerScreening.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(compareSelected.pending, (state) => {
        state.loading = true;
      })
      .addCase(compareSelected.fulfilled, (state, action) => {
        state.loading = false;
        state.comparison = action.payload;
      })
      .addCase(compareSelected.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { toggleSelectForCompare, clearComparison } =
  screeningSlice.actions;
export default screeningSlice.reducer;