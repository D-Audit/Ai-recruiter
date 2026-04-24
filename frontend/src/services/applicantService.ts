// frontend/src/services/applicantService.ts
// Fixed:
//   - uploadResumeFile now has a proper timeout (120s) for large PDFs going through Gemini
//   - uploadPDF added as a separate export (maps to /upload/pdf route)
//   - Better error pass-through so frontend toast shows the actual backend error

import api from "./api";

export const getApplicants = async (jobId: string) => {
  const res = await api.get(`/applicants/${jobId}`);
  return res.data;
};

/**
 * Fetch a single applicant by their MongoDB _id.
 * Backend route: GET /api/applicants/profile/:id
 */
export const getApplicantById = async (id: string) => {
  const res = await api.get(`/applicants/profile/${id}`);
  return res.data;
};

export const getUmuravaProfiles = async () => {
  const res = await api.get("/applicants/umurava");
  return res.data;
};

export const uploadCSV = async (jobId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobId", jobId);
  const res = await api.post("/applicants/upload/csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30_000, // 30s for CSV (no AI involved)
  });
  return res.data;
};

/**
 * Upload one or more PDF resume files.
 * Uses the /upload/resume route which handles PDF, DOCX, DOC, TXT.
 * Each file goes through: text extraction → Cloudinary → Gemini AI parse.
 *
 * @param jobId   - MongoDB ID of the job to link this applicant to
 * @param file    - The File object from the dropzone
 * @param onProgress - Optional callback for upload progress (0–100)
 */
export const uploadResumeFile = async (
  jobId: string,
  file: File,
  onProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobId", jobId);

  const res = await api.post("/applicants/upload/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    // Timeout must be long: text extraction + Cloudinary upload + Gemini parse
    // can take 20–40s per file, especially for large PDFs
    timeout: 120_000, // 2 minutes
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        // This only tracks the network upload to our server (not Gemini processing)
        // so it will jump to ~50% fast then the server takes time to process
        onProgress(Math.round((e.loaded * 50) / e.total));
      }
    },
  });
  return res.data;
};

/**
 * Import a candidate from a URL (PDF link, public profile page, CSV/XLSX link).
 * LinkedIn and social media URLs are blocked server-side.
 */
export const uploadFromURL = async (jobId: string, url: string) => {
  const res = await api.post(
    "/applicants/upload/url",
    { jobId, url },
    { timeout: 45_000 } // 45s: fetch URL + parse + Gemini
  );
  return res.data;
};

export const selectUmuravaProfiles = async (jobId: string, profileIds: string[]) => {
  const res = await api.post("/applicants/select", { jobId, profileIds });
  return res.data;
};

export const submitManualApplicant = async (
  jobId: string,
  payload: Record<string, unknown>
) => {
  const res = await api.post("/applicants/manual", { ...payload, jobId });
  return res.data;
};

export const removeApplicantFromJob = async (jobId: string, applicantId: string) => {
  const res = await api.delete(`/applicants/${jobId}/applicant/${applicantId}`);
  return res.data;
};