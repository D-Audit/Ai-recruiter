import fs from "fs";
import { callGeminiWithRetry } from "./ai.service";

// ── Send extracted text to Gemini for smart parsing
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

  // Strip any accidental markdown backticks Gemini might add
  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned invalid JSON for PDF parsing");
  }
}

// ── Split full PDF text into per-candidate blocks using email as boundary
function splitIntoBlocks(fullText: string): string[] {
  const emailRegex = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
  const matches: { index: number }[] = [];
  let match;

  while ((match = emailRegex.exec(fullText)) !== null) {
    matches.push({ index: match.index });
  }

  if (matches.length === 0) return [];
  if (matches.length === 1) return [fullText];

  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = Math.max(0, matches[i].index - 300);
    const end   = i + 1 < matches.length
      ? Math.max(0, matches[i + 1].index - 300)
      : fullText.length;
    blocks.push(fullText.slice(start, end));
  }

  return blocks;
}

// ── Parse single or multi-candidate PDF using Gemini
export async function parseMultiPDFResume(filePath: string): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const buffer   = fs.readFileSync(filePath);
    const data     = await pdfParse(buffer);
    const text: string = data.text || "";

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    if (!text.trim()) {
      throw new Error("PDF appears to be empty or scanned image — no text could be extracted");
    }

    const blocks = splitIntoBlocks(text);

    if (blocks.length === 0) {
      // No emails found at all — send full text to Gemini and let it try
      const result = await extractWithGemini(text);
      if (!result.email) return [];
      return [{ ...result, source: "external" }];
    }

    // Parse each block with Gemini in sequence
    const results: any[] = [];
    for (const block of blocks) {
      try {
        const parsed = await extractWithGemini(block);
        if (parsed.email) {
          results.push({ ...parsed, source: "external" });
        }
      } catch (err) {
        console.warn("Skipping block — Gemini parse failed:", err);
      }
    }

    return results;
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`PDF parsing failed: ${error}`);
  }
}

// ── Keep parsePDFResume for backward compatibility (single candidate)
export async function parsePDFResume(filePath: string): Promise<any> {
  const results = await parseMultiPDFResume(filePath);
  if (results.length === 0) return { email: "" };
  return results[0];
}