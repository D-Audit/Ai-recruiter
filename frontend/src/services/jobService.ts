import api from "./api";

export const getAllJobs = async () => {
  const res = await api.get("/jobs");
  return res.data;
};

export const createJob = async (data: any) => {
  const res = await api.post("/jobs", data);
  return res.data;
};

export const getJob = async (id: string) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
};

export const updateJob = async (id: string, data: any) => {
  const res = await api.put(`/jobs/${id}`, data);
  return res.data;
};

export const deleteJob = async (id: string) => {
  const res = await api.delete(`/jobs/${id}`);
  return res.data;
};