// umurava-backend/src/services/batch.resume.service.ts
//
// ✅ Gemini Batch Parsing — reduces API calls from N to ceil(N/BATCH_SIZE)
//
// For a ZIP with 50 CVs:
//   OLD: 50 separate Gemini calls → rate limit risk, slow
//   NEW: 7 Gemini calls (batches of 8) → fast, stays within limits
//
// For a multi-person PDF (multiple CVs in one file):
//   OLD: split by email regex (fragile) → parse each block separately
//   NEW: one Gemini call: "find all CVs in this text, return array"

import { callGeminiWithRetry } from "./ai.service";

// How many resumes to send in one Gemini call.
// 8 is safe — each CV is ~2000-6000 chars, so 8 × 6000 = ~48k chars,
// well within Gemini's context. Increase to 12 if resumes are short.
const BATCH_SIZE = 8;

// Max chars per resume text in batch mode (to keep total prompt size sane)
const MAX_CHARS_PER_RESUME = 6000;

// ─────────────────────────────────────────────────────────────────────────────
// Skill sanitization (same rules as resume.service.ts)
// ─────────────────────────────────────────────────────────────────────────────
const VALID_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const TITLE_PATTERN = /\b(instructor|teacher|manager|director|coordinator|developer|engineer|analyst|officer|specialist|consultant|executive|president|founder|lead|head|chief)\b/i;

function sanitizeSkills(skills: any[]): any[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .filter((sk: any) => {
      if (!sk || typeof sk.name !== "string") return false;
      const name = sk.name.trim();
      if (name.length < 2 || name.length > 45) return false;
      if (name.split(/\s+/).length > 5) return false;
      if (/\d{4}/.test(name)) return false;
      if (/^(mr|ms|mrs|dr|prof|rev|sir)\b/i.test(name)) return false;
      const words = name.split(/\s+/);
      if (words.length === 2 && words.every((w: string) => /^[A-Z][a-z]+$/.test(w))) return false;
      if (TITLE_PATTERN.test(name) && name.split(/\s+/).length >= 2) return false;
      return true;
    })
    .map((sk: any) => ({
      name: sk.name.trim(),
      level: VALID_LEVELS.includes(sk.level) ? sk.level : "Intermediate",
      yearsOfExperience:
        typeof sk.yearsOfExperience === "number" && sk.yearsOfExperience >= 0
          ? Math.round(sk.yearsOfExperience) : 0,
    }));
}

function sanitizeProfile(parsed: any, filename: string): any {
  parsed.skills = sanitizeSkills(parsed.skills || []);
  parsed.languages     = Array.isArray(parsed.languages)      ? parsed.languages      : [];
  parsed.experience    = Array.isArray(parsed.experience)     ? parsed.experience     : [];
  parsed.education     = Array.isArray(parsed.education)      ? parsed.education      : [];
  parsed.certifications= Array.isArray(parsed.certifications) ? parsed.certifications : [];
  parsed.projects      = Array.isArray(parsed.projects)       ? parsed.projects       : [];

  const validStatuses = ["Available", "Open to Opportunities", "Not Available"];
  const validTypes    = ["Full-time", "Part-time", "Contract"];
  if (!validStatuses.includes(parsed.availability?.status)) {
    parsed.availability = { ...parsed.availability, status: "Available" };
  }
  if (!validTypes.includes(parsed.availability?.type)) {
    parsed.availability = { ...parsed.availability, type: "Full-time" };
  }
  return { ...parsed, source: "external" };
}

// ─────────────────────────────────────────────────────────────────────────────
// The full applicant JSON structure Gemini must return per resume
// ─────────────────────────────────────────────────────────────────────────────
const APPLICANT_STRUCTURE = `{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "headline": "",
  "bio": "",
  "location": "",
  "skills": [{ "name": "", "level": "Intermediate", "yearsOfExperience": 0 }],
  "languages": [{ "name": "", "proficiency": "Fluent" }],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "", "technologies": [], "isCurrent": false }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": 0, "endYear": 0 }],
  "certifications": [{ "name": "", "issuer": "", "issueDate": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "role": "", "link": "", "startDate": "", "endDate": "" }],
  "availability": { "status": "Available", "type": "Full-time", "startDate": "" },
  "socialLinks": { "linkedin": "", "github": "", "portfolio": "" }
}`;

const SKILL_RULES = `
SKILLS — only include: programming languages, frameworks, tools, platforms, databases,
methodologies, professional skills. NEVER include: people's names, job titles, company
names, sentences longer than 5 words, anything with a 4-digit year.
Skill level: Expert (7+yrs primary tool), Advanced (4-6yrs), Intermediate (2-3yrs), Beginner (<1yr).
yearsOfExperience: calculate from dates in resume. Use 0 if unknown — do NOT default to 1.
Languages: human languages only (English, French...), NOT programming languages.`;

// ─────────────────────────────────────────────────────────────────────────────
// BATCH PARSE — multiple resume texts → one Gemini call → array of profiles
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumeInput {
  text: string;
  filename: string;
}

/**
 * Parse multiple resume texts in a single Gemini call.
 * Returns one profile per input, in the same order.
 * Falls back to empty profile (with filename as name) if a specific resume fails.
 */
export async function batchParseResumes(resumes: ResumeInput[]): Promise<any[]> {
  if (resumes.length === 0) return [];

  // Split into sub-batches of BATCH_SIZE
  const allResults: any[] = [];
  const batches: ResumeInput[][] = [];
  for (let i = 0; i < resumes.length; i += BATCH_SIZE) {
    batches.push(resumes.slice(i, i + BATCH_SIZE));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`🤖 Batch parsing ${batch.length} resumes (batch ${bi + 1}/${batches.length})`);

    const batchResults = await parseBatch(batch);
    allResults.push(...batchResults);

    // Rate limit gap between batches
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  return allResults;
}

async function parseBatch(resumes: ResumeInput[]): Promise<any[]> {
  // Build the prompt: N sections separated by clear markers
  const sections = resumes.map((r, i) =>
    `===RESUME_${i + 1}: ${r.filename}===\n${r.text.slice(0, MAX_CHARS_PER_RESUME)}`
  ).join("\n\n");

  const prompt = `You are an expert resume parser processing ${resumes.length} resume${resumes.length !== 1 ? "s" : ""}.

Each resume is separated by ===RESUME_N: filename=== markers.
Return a JSON array of exactly ${resumes.length} objects, one per resume, in the SAME ORDER as the markers.

Each object must exactly follow this structure:
${APPLICANT_STRUCTURE}
${SKILL_RULES}

OTHER RULES:
- email: exact email from the resume, or "" if not found. NEVER fabricate an email.
- bio: the Summary/Profile/About section verbatim if present, else "".
- isCurrent: true ONLY if the role explicitly says "present", "current", or has no end date as the latest role.
- availability.status: "Available" | "Open to Opportunities" | "Not Available"
- availability.type: "Full-time" | "Part-time" | "Contract"
- socialLinks: extract full URLs for linkedin/github/portfolio if mentioned anywhere.
- If any field has no data: use "" for strings, 0 for numbers, [] for arrays.

Return ONLY the JSON array. No markdown. No backticks. No explanation. No text before or after the array.

${sections}`;

  try {
    const raw = await callGeminiWithRetry(prompt, 3);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: any[];
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract a JSON array from the response
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Gemini batch response did not contain a JSON array");
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Gemini batch response is not an array");
    }

    // Ensure we have the right number of results
    if (parsed.length !== resumes.length) {
      console.warn(`⚠️  Gemini returned ${parsed.length} results for ${resumes.length} resumes — padding/trimming`);
      // Pad with fallback profiles if Gemini returned fewer
      while (parsed.length < resumes.length) {
        parsed.push(fallbackProfile(resumes[parsed.length].filename));
      }
      // Trim if Gemini returned more
      parsed = parsed.slice(0, resumes.length);
    }

    // Sanitize each profile
    const sanitized = parsed.map((p, i) => {
      if (!p || typeof p !== "object") return fallbackProfile(resumes[i].filename);
      // If Gemini couldn't parse a resume it sometimes returns null or {}
      if (!p.firstName && !p.lastName && !p.email) {
        console.warn(`⚠️  Empty profile returned for ${resumes[i].filename} — using fallback`);
        return fallbackProfile(resumes[i].filename);
      }
      return sanitizeProfile(p, resumes[i].filename);
    });

    console.log(`✅ Batch ${resumes.length} resumes parsed — ${sanitized.filter(p => p.email).length} with email`);
    return sanitized;

  } catch (error: any) {
    console.error(`❌ Batch parse failed:`, error.message);
    // Return individual fallback profiles — caller will try single-file fallback
    return resumes.map(r => fallbackProfile(r.filename));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-PERSON PDF — send full text to Gemini, get ALL applicants back
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a PDF that contains multiple CVs concatenated together.
 * Sends the full text to Gemini once and asks it to find ALL applicants.
 * Much more accurate than the old email-boundary regex splitting.
 *
 * @param fullText   - The complete extracted text from the PDF
 * @param filename   - Original PDF filename (for logging/fallback)
 * @returns          - Array of parsed applicant profiles
 */
export async function parseMultiPersonPDF(
  fullText: string,
  filename: string
): Promise<any[]> {
  if (!fullText || fullText.trim().length < 50) return [];

  // Truncate to Gemini's safe limit (~100k chars = ~75k tokens, well within 1M limit)
  const text = fullText.slice(0, 100_000);

  const prompt = `You are an expert resume parser. The text below contains ONE OR MORE CVs/resumes concatenated together in a single document.

Your task:
1. Identify each individual candidate's CV within the text.
2. For EACH candidate found, extract their complete profile.
3. Return a JSON ARRAY with one object per candidate.

If there is only 1 candidate → return an array with 1 object.
If there are N candidates → return an array with N objects.

Each object must follow this exact structure:
${APPLICANT_STRUCTURE}
${SKILL_RULES}

HOW TO DETECT INDIVIDUAL CVS:
- Each CV typically starts with a person's full name followed by contact details (email, phone, location).
- Look for patterns like: "John Smith\\njohn@email.com" or "CURRICULUM VITAE\\nAlice Uwimana".
- Section headers (EXPERIENCE, EDUCATION, SKILLS, SUMMARY) belong to the most recently introduced person.
- When you see a new name + contact info, that is the start of a new candidate.

IMPORTANT:
- email: exact email from the resume, or "" if not found. Do NOT fabricate emails.
- bio: the Summary/Profile/About section verbatim if present, else "".
- Return ONLY the JSON array. No markdown. No backticks. No explanation.

PDF TEXT:
${text}`;

  try {
    const raw = await callGeminiWithRetry(prompt, 3);
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    let parsed: any[];
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Response is not a JSON array");
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    const sanitized = parsed
      .filter(p => p && typeof p === "object" && (p.firstName || p.lastName || p.email))
      .map(p => sanitizeProfile(p, filename));

    console.log(`✅ Multi-person PDF parsed: ${sanitized.length} candidate${sanitized.length !== 1 ? "s" : ""} found in ${filename}`);
    return sanitized;

  } catch (error: any) {
    console.error(`❌ Multi-person PDF parse failed for ${filename}:`, error.message);
    return []; // caller will fall back to single-person parse
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback profile when Gemini fails for a specific resume
// ─────────────────────────────────────────────────────────────────────────────
function fallbackProfile(filename: string): any {
  const namePart = filename
    .replace(/\.(pdf|docx?|txt|odt)$/i, "")
    .replace(/[_-]/g, " ")
    .split(" ");

  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  return {
    firstName:      cap(namePart[0] || "Unknown"),
    lastName:       namePart.slice(1).map(cap).join(" ") || "Candidate",
    email:          "",
    phone:          "",
    headline:       "Resume uploaded — please review and complete this profile manually",
    bio:            `Automatic parsing failed for ${filename}. Please update this profile manually.`,
    location:       "",
    skills:         [],
    languages:      [{ name: "English", proficiency: "Fluent" }],
    experience:     [],
    education:      [],
    certifications: [],
    projects:       [],
    availability:   { status: "Available", type: "Full-time", startDate: "" },
    socialLinks:    { linkedin: "", github: "", portfolio: "" },
    source:         "external",
  };
}