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

export const uploadPDF = async (jobId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jobId", jobId);
  const res = await api.post("/applicants/upload/pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const selectUmuravaProfiles = async (
  jobId: string,
  profileIds: string[]
) => {
  const res = await api.post("/applicants/select", { jobId, profileIds });
  return res.data;
};