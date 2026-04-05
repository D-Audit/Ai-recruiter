import { CandidateResult } from "../types/index";

export function parseScreeningResponse(rawText: string): CandidateResult[] {
  let cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in AI response");
  }

  const jsonString = cleaned.substring(start, end + 1);
  const parsed = JSON.parse(jsonString);

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array");
  }

  return parsed as CandidateResult[];
}

export function parseComparisonResponse(rawText: string): any {
  let cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON found in comparison response");
  }

  return JSON.parse(cleaned.substring(start, end + 1));
}