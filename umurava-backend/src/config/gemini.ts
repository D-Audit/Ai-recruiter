// umurava-backend/src/config/gemini.ts
//
// Model: "gemini-2.5-flash-lite" — confirmed working, fast, free-tier friendly.
// This is a valid and stable Gemini model.
//
// Alternative options:
//   "gemini-2.0-flash"                  — stable, slightly older
//   "gemini-2.5-flash-preview-05-20"    — latest preview (may change)

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