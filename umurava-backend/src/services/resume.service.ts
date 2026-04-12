// src/services/resume.service.ts
//
// Handles text extraction from DOCX, DOC, TXT, ODT files.
// PDF is already handled by pdf.service.ts — we reuse it here.
// After extraction, text goes to the same extractWithGemini() pattern
// already used in pdf.service.ts.

import fs from "fs";
import path from "path";
import { callGeminiWithRetry } from "./ai.service";

// ── mammoth handles DOCX and DOC ─────────────────────────────────────────────
// Install: npm install mammoth
// mammoth is CommonJS so we require() it
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mammoth = require("mammoth");

// ── The same Gemini prompt already used in pdf.service.ts ────────────────────
async function extractWithGemini(resumeText: string): Promise<any> {
  const prompt = `
Extract the following information from this resume text and return ONLY a valid JSON object with no explanation, no markdown, no backticks.

{
  "firstName": "",
  "lastName": "",
  "email": "",
  "headline": "",
  "bio": "",
  "location": "",
  "skills": [{ "name": "", "level": "Intermediate", "yearsOfExperience": 0 }],
  "languages": [{ "name": "", "proficiency": "Fluent" }],
  "experience": [{
    "company": "",
    "role": "",
    "startDate": "",
    "endDate": "",
    "description": "",
    "technologies": [],
    "isCurrent": false
  }],
  "education": [{
    "institution": "",
    "degree": "",
    "fieldOfStudy": "",
    "startYear": 0,
    "endYear": 0
  }],
  "certifications": [{ "name": "", "issuer": "", "issueDate": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "role": "" }],
  "availability": { "status": "Available", "type": "Full-time", "startDate": "" },
  "socialLinks": { "linkedin": "", "github": "", "portfolio": "" }
}

Rules:
- Return ONLY the JSON object, nothing else
- If a field is not found leave it as empty string or empty array
- Extract ALL skills mentioned anywhere in the resume
- For skills level use only: Beginner, Intermediate, Advanced, Expert
- For languages proficiency use only: Basic, Conversational, Fluent, Native
- For availability status use only: Available, Open to Opportunities, Not Available
- For availability type use only: Full-time, Part-time, Contract
- For isCurrent set true if the person is still working there
- yearsOfExperience for each skill should be a number, default 0 if unknown

Resume text:
${resumeText}
`;

  const raw = await callGeminiWithRetry(prompt);
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON for resume parsing");
  }
}

// ── Extract raw text depending on file extension ──────────────────────────────
async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    // Reuse existing pdf-parse (already a dependency)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (ext === ".docx" || ext === ".doc") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  if (ext === ".txt" || ext === ".odt") {
    // For TXT: read directly. For ODT: mammoth can also handle it.
    if (ext === ".odt") {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || "";
      } catch {
        // Fallback: read as plain text
        return fs.readFileSync(filePath, "utf-8");
      }
    }
    return fs.readFileSync(filePath, "utf-8");
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ── Main export: parse a resume file → structured applicant object ────────────
export async function parseResumeFile(filePath: string): Promise<any> {
  try {
    const rawText = await extractRawText(filePath);

    // Clean up temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (!rawText || rawText.trim().length < 50) {
      throw new Error(
        "Could not extract enough text from this file. If it is a scanned PDF, it may need OCR."
      );
    }

    // Trim to 12000 chars so we don't blow the Gemini context limit
    const trimmedText = rawText.slice(0, 12000);

    const profile = await extractWithGemini(trimmedText);

    // source is always external for uploaded resumes
    return { ...profile, source: "external" };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
}