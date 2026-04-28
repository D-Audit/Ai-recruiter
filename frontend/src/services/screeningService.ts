// frontend/src/services/screeningService.ts
import api, { screeningApi } from "./api";

// ── Error classifier ──────────────────────────────────────────────────────────
// Maps raw axios/server errors into clear messages the recruiter can act on.
function classifyError(error: any): { message: string; errorCode: string } {
  // Server sent a structured error
  const serverMsg  = error?.response?.data?.message || "";
  const serverCode = error?.response?.data?.errorCode || "";
  const httpStatus = error?.response?.status || 0;
  const axiosMsg   = (error?.message || "").toLowerCase();

  // 1. Axios timeout — the request took longer than 3 minutes
  if (error?.code === "ECONNABORTED" || axiosMsg.includes("timeout")) {
    return {
      errorCode: "TIMEOUT",
      message:
        "AI screening is taking longer than expected (3 min limit). " +
        "This usually means Gemini is overloaded. Please wait 1 minute and try again. " +
        "Your candidates are saved — no re-upload needed.",
    };
  }

  // 2. Network error — can't reach the server at all
  if (error?.code === "ERR_NETWORK" || axiosMsg.includes("network error")) {
    return {
      errorCode: "NETWORK_ERROR",
      message:
        "Cannot reach the server. Check your internet connection and try again.",
    };
  }

  // 3. Gemini quota / rate limit (429)
  if (
    httpStatus === 429 ||
    serverCode === "GEMINI_QUOTA" ||
    serverMsg.toLowerCase().includes("quota") ||
    serverMsg.toLowerCase().includes("rate limit") ||
    serverMsg.toLowerCase().includes("resource_exhausted") ||
    serverMsg.toLowerCase().includes("429")
  ) {
    return {
      errorCode: "GEMINI_QUOTA",
      message:
        "Gemini AI quota reached — you've used all your free-tier tokens for today. " +
        "Options: (1) Wait until tomorrow for the quota to reset, " +
        "(2) Upgrade to a paid Gemini API key for unlimited screening.",
    };
  }

  // 4. Gemini overloaded / unavailable (503)
  if (
    httpStatus === 503 ||
    serverCode === "GEMINI_UNAVAILABLE" ||
    serverMsg.toLowerCase().includes("overloaded") ||
    serverMsg.toLowerCase().includes("503") ||
    serverMsg.toLowerCase().includes("service unavailable")
  ) {
    return {
      errorCode: "GEMINI_UNAVAILABLE",
      message:
        "Gemini AI is temporarily overloaded. This usually clears in 1-2 minutes. " +
        "Please wait and try again.",
    };
  }

  // 5. Bad Gemini API key
  if (
    httpStatus === 401 ||
    serverCode === "GEMINI_AUTH" ||
    serverMsg.toLowerCase().includes("api key") ||
    serverMsg.toLowerCase().includes("invalid key") ||
    serverMsg.toLowerCase().includes("401")
  ) {
    return {
      errorCode: "GEMINI_AUTH",
      message:
        "Gemini API key is missing or invalid. " +
        "Please check GEMINI_API_KEY in your Railway environment variables.",
    };
  }

  // 6. No candidates uploaded yet
  if (
    serverCode === "NO_CANDIDATES" ||
    serverMsg.toLowerCase().includes("no applicants") ||
    serverMsg.toLowerCase().includes("no candidates")
  ) {
    return {
      errorCode: "NO_CANDIDATES",
      message:
        "No candidates found for this job. " +
        "Upload candidate CVs first, then run AI screening.",
    };
  }

  // 7. Job not found
  if (httpStatus === 404) {
    return {
      errorCode: "NOT_FOUND",
      message: serverMsg || "Job not found. It may have been deleted.",
    };
  }

  // 8. Server returned a message we can use directly
  if (serverMsg) {
    return { errorCode: serverCode || "SERVER_ERROR", message: serverMsg };
  }

  // 9. Fallback
  return {
    errorCode: "UNKNOWN",
    message:
      "Screening failed for an unknown reason. " +
      "Check Railway logs for details and try again.",
  };
}

// ── runScreening — uses screeningApi (3-min timeout) ─────────────────────────
export const runScreening = async (
  jobId: string,
  forceRerun = false,
  topN?: number | "all"
) => {
  try {
    const body: Record<string, unknown> = { forceRerun };
    if (topN !== undefined) body.topN = topN;
    // ✅ screeningApi — 3-minute timeout, not the 20s default api
    const res = await screeningApi.post(`/screening/run/${jobId}`, body);
    return res.data;
  } catch (error: any) {
    const { message, errorCode } = classifyError(error);
    const err = new Error(message);
    (err as any).errorCode = errorCode;
    throw err;
  }
};

// ── getResults ────────────────────────────────────────────────────────────────
export const getResults = async (jobId: string) => {
  try {
    const res = await api.get(`/screening/results/${jobId}`);
    return res.data;
  } catch (error: any) {
    const { message, errorCode } = classifyError(error);
    const err = new Error(message);
    (err as any).errorCode = errorCode;
    throw err;
  }
};

// ── compareApplicants ─────────────────────────────────────────────────────────
export const compareApplicants = async (jobId: string, candidateIds: string[]) => {
  try {
    const res = await screeningApi.post("/screening/compare", { jobId, candidateIds });
    return res.data;
  } catch (error: any) {
    const { message, errorCode } = classifyError(error);
    const err = new Error(message);
    (err as any).errorCode = errorCode;
    throw err;
  }
};

// Alias — some pages import compareCandidates, others compareApplicants
export const compareCandidates = compareApplicants;

// ── getAllScreenings ───────────────────────────────────────────────────────────
export const getAllScreenings = async () => {
  try {
    const res = await api.get("/screening/all");
    return res.data;
  } catch (error: any) {
    const { message } = classifyError(error);
    throw new Error(message);
  }
};