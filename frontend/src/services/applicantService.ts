import api from "./api";

export const getApplicants = async (jobId: string) => {
  const res = await api.get(`/applicants/${jobId}`);
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
  });
  return res.data;
};

/**
 * Upload a single resume file (PDF, DOCX, DOC, TXT, ODT).
 * Backend endpoint: POST /applicants/upload/resume
 * The backend extracts text, sends to AI, and saves the applicant.
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
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data;
};

/**
 * Import an applicant from a URL (PDF link, LinkedIn profile page, Google Drive, etc).
 * Backend endpoint: POST /applicants/upload/url
 */
export const uploadFromURL = async (jobId: string, url: string) => {
  const res = await api.post("/applicants/upload/url", { jobId, url });
  return res.data;
};

export const selectUmuravaProfiles = async (
  jobId: string,
  profileIds: string[]
) => {
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