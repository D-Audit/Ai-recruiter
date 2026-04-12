import api from "./api";

export const sendChatMessage = async (message: string, context: unknown) => {
  const res = await api.post("/chat", { message, context });
  return res.data as { success: boolean; response: string };
};
