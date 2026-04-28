// frontend/src/store/slices/screeningSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  runScreening,
  getResults,
  compareApplicants,
} from "../../services/screeningService";
import type { ScreeningResult } from "../../types";
import { buildScreeningChatContext } from "../../utils/screeningChatContext";

// ── triggerScreening ──────────────────────────────────────────────────────────
export const triggerScreening = createAsyncThunk(
  "screening/run",
  async (
    params: { jobId: string; forceRerun?: boolean; topN?: number | "all" },
    { rejectWithValue }
  ) => {
    try {
      const { jobId, forceRerun = false, topN } = params;
      const body = await runScreening(jobId, forceRerun, topN);
      return {
        result:    body.data as ScreeningResult,
        fromCache: Boolean(body.fromCache),
      };
    } catch (error: any) {
      // error.message is already the classified human-readable message
      // from screeningService — pass it straight through
      return rejectWithValue(error.message || "Screening failed");
    }
  }
);

// ── fetchResults ──────────────────────────────────────────────────────────────
export const fetchResults = createAsyncThunk(
  "screening/results",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const data = await getResults(jobId);
      return data.data as ScreeningResult;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to get results");
    }
  }
);

// ── compareSelected ───────────────────────────────────────────────────────────
export const compareSelected = createAsyncThunk(
  "screening/compare",
  async (
    { jobId, candidateIds }: { jobId: string; candidateIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      const data = await compareApplicants(jobId, candidateIds);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Comparison failed");
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const screeningSlice = createSlice({
  name: "screening",
  initialState: {
    results:    null as ScreeningResult | null,
    fromCache:  false,
    assistantScreeningContext: null as Record<string, unknown> | null,
    comparison:         null as unknown,
    selectedForCompare: [] as string[],
    loading: false,
    error:   null as string | null,
  },
  reducers: {
    toggleSelectForCompare: (state, action: { payload: string }) => {
      const id = action.payload;
      if (state.selectedForCompare.includes(id)) {
        state.selectedForCompare = state.selectedForCompare.filter((i) => i !== id);
      } else if (state.selectedForCompare.length < 3) {
        state.selectedForCompare.push(id);
      }
    },
    clearCompare: (state) => {
      state.comparison        = null;
      state.selectedForCompare = [];
    },
    clearResults: (state) => {
      state.results           = null;
      state.fromCache         = false;
      state.selectedForCompare = [];
      state.error             = null;
      // ✅ Do NOT clear assistantScreeningContext here — the AI assistant
      //    should keep its context even when results reload
    },
    clearAssistantContext: (state) => {
      state.assistantScreeningContext = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // triggerScreening
      .addCase(triggerScreening.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(triggerScreening.fulfilled, (state, action) => {
        state.loading   = false;
        state.results   = action.payload.result;
        state.fromCache = action.payload.fromCache;
        const ctx = buildScreeningChatContext(action.payload.result);
        if (ctx) state.assistantScreeningContext = ctx;
      })
      .addCase(triggerScreening.rejected, (state, action) => {
        state.loading = false;
        // action.payload is the classified message from rejectWithValue
        state.error   = action.payload as string;
      })

      // fetchResults
      .addCase(fetchResults.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.results   = action.payload;
        state.fromCache = false;
        const ctx = buildScreeningChatContext(action.payload);
        if (ctx) state.assistantScreeningContext = ctx;
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // compareSelected
      .addCase(compareSelected.pending, (state) => {
        state.loading = true;
      })
      .addCase(compareSelected.fulfilled, (state, action) => {
        state.loading    = false;
        state.comparison = action.payload;
      })
      .addCase(compareSelected.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload as string;
      });
  },
});

export const {
  toggleSelectForCompare,
  clearCompare,
  clearResults,
  clearAssistantContext,
} = screeningSlice.actions;

export default screeningSlice.reducer;