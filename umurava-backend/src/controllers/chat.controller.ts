import { Response } from "express";
import { geminiModel } from "../config/gemini";

export const chatWithAI = async (req: any, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;

    const prompt = `
You are an AI recruitment assistant helping a recruiter make hiring decisions.

CONTEXT (screening results for current job):
${JSON.stringify(context)}

RECRUITER QUESTION:
${message}

Answer the recruiter's question clearly and helpfully.
Focus on helping them make a good hiring decision.
Keep your answer concise and professional.
    `;
    

    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();

    res.json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, message: "Chat failed" });
  }
};