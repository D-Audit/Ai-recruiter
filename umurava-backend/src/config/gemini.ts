// umurava-backend/src/config/gemini.ts
//
// ✅ FIXED: Model name changed from "gemini-2.5-flash-lite" (does not exist)
//           to "gemini-2.0-flash" (stable, fast, free-tier friendly).
//
// If you want the absolute latest: use "gemini-2.5-flash-preview-05-20"
// but "gemini-2.0-flash" is the safest stable choice right now.

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in .env file");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",          // ✅ valid stable model (fast + free-tier)
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 8192,
  },
});

export default genAI;