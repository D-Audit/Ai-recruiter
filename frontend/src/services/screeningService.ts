// frontend/src/services/screeningService.ts
import api from "./api";

/**
 * Extract a user-friendly error message from an axios error response.
 * The backend now sends `message` with exact error details.
 */
function extractError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message === "Network Error" || error?.code === "ERR_NETWORK") {
    return "Cannot reach the server. Please check your connection.";
  }
  if (error?.message) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Run AI screening for a job.
 * @param jobId      - The job to screen candidates for.
 * @param forceRerun - If true, bypass the cache and re-run even if results exist.
 * @param topN       - Limit results to top N candidates (or "all").
 */
export const runScreening = async (
  jobId: string,
  forceRerun = false,
  topN?: number | "all"
) => {
  try {
    const body: Record<string, unknown> = { forceRerun };
    if (topN !== undefined) body.topN = topN;
    const res = await api.post(`/screening/run/${jobId}`, body);
    return res.data;
  } catch (error: any) {
    const message = extractError(error);
    const err = new Error(message);
    (err as any).errorCode = error?.response?.data?.errorCode;
    (err as any).detail    = error?.response?.data?.detail;
    throw err;
  }
};

export const getResults = async (jobId: string) => {
  try {
    const res = await api.get(`/screening/results/${jobId}`);
    return res.data;
  } catch (error: any) {
    const message = extractError(error);
    const err = new Error(message);
    (err as any).errorCode = error?.response?.data?.errorCode;
    throw err;
  }
};

export const compareApplicants = async (jobId: string, candidateIds: string[]) => {
  try {
    const res = await api.post("/screening/compare", { jobId, candidateIds });
    return res.data;
  } catch (error: any) {
    const message = extractError(error);
    const err = new Error(message);
    (err as any).errorCode = error?.response?.data?.errorCode;
    throw err;
  }
};

export const getAllScreenings = async () => {
  try {
    const res = await api.get("/screening/all");
    return res.data;
  } catch (error: any) {
    const message = extractError(error);
    throw new Error(message);
  }
};