import { Response } from "express";
import { chatWithRecruiter } from "../services/ai.service";

export const chatWithAI = async (req: any, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;

    const response = await chatWithRecruiter(message, context);

    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, message: "Chat failed" });
  }
};