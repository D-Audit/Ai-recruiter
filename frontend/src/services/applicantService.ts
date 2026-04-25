import api from "./api";

export const getApplicants = async (jobId: string) => {
  const res = await api.get(`/applicants/${jobId}`);
  return res.data;
};

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
  });
  return res.data;
};

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
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data;
};

/**
 * Upload multiple resume files at once.
 * Returns { queued: true, queueId, total } immediately — no timeout risk.
 * Use pollQueueStatus() to track progress.
 */
export const uploadResumeFiles = async (
  jobId: string,
  files: File[],
  onUploadProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("file", f));
  formData.append("jobId", jobId);
  const res = await api.post("/applicants/upload/resume", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) onUploadProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data;
};

/**
 * Upload a ZIP file containing many CVs.
 * Returns { queued: true, queueId, total, skipped } immediately.
 * Use pollQueueStatus() to track progress.
 */
export const uploadZipFile = async (
  jobId: string,
  file: File,
  onUploadProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobId", jobId);
  const res = await api.post("/applicants/upload/zip", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onUploadProgress && e.total) onUploadProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data;
};

/**
 * Poll the background queue for progress.
 * Returns { status, total, done, succeeded, duplicates, failed, results }
 */
export const pollQueueStatus = async (queueId: string) => {
  const res = await api.get(`/applicants/queue/${queueId}`);
  return res.data;
};

export const uploadFromURL = async (jobId: string, url: string) => {
  const res = await api.post("/applicants/upload/url", { jobId, url });
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