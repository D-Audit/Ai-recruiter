import api from "./api";

export const runScreening = async (jobId: string) => {
  const res = await api.post(`/screening/run/${jobId}`);
  return res.data;
};

export const getResults = async (jobId: string) => {
  const res = await api.get(`/screening/results/${jobId}`);
  return res.data;
};

export const compareCandidates = async (
  jobId: string,
  candidateIds: string[]
) => {
  const res = await api.post("/screening/compare", { jobId, candidateIds });
  return res.data;
};