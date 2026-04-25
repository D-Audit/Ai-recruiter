// umurava-backend/src/services/resume.service.ts
//
// ✅ Gemini AI parses everything — skill level, years, experience, projects
// ✅ Improved prompt: Gemini infers skill level from context, not just defaults
// ✅ Skill sanitization: removes names, job titles, bad entries from Gemini output
// ✅ Regex fallback: full structural parser — experience, education, projects,
//    certifications, languages, bio, location — all extracted without Gemini
// ✅ Retry with exponential backoff — handles 503/429/network errors
// ✅ Cloudinary upload before cleanup
// ✅ Scanned PDFs handled gracefully
// ✅ parseWithGemini now uses the same 3-layer JSON repair as ai.parser.ts
//    (smart quotes, control chars, trailing commas) — matches screening robustness

import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Extract raw text from file
// ─────────────────────────────────────────────────────────────────────────────

async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const pdfParseModule = require("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (ext === ".docx" || ext === ".doc") {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  if (ext === ".odt") {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    } catch {
      return fs.readFileSync(filePath, "utf-8");
    }
  }

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Gemini prompt (highly accurate, infers levels from context)
// ─────────────────────────────────────────────────────────────────────────────

const PARSE_PROMPT = (text: string) => `
You are an expert resume parser. Your job is to extract every piece of information from the resume text below and return it as a single valid JSON object. No markdown, no backticks, no explanation — return only the raw JSON.

═══════════════════════════════════════
OUTPUT STRUCTURE (return exactly this):
═══════════════════════════════════════
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "headline": "",
  "bio": "",
  "location": "",
  "skills": [
    { "name": "", "level": "Intermediate", "yearsOfExperience": 0 }
  ],
  "languages": [
    { "name": "", "proficiency": "Fluent" }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "technologies": [],
      "isCurrent": false
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "fieldOfStudy": "",
      "startYear": 0,
      "endYear": 0
    }
  ],
  "certifications": [
    { "name": "", "issuer": "", "issueDate": "" }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "role": "",
      "link": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "availability": {
    "status": "Available",
    "type": "Full-time",
    "startDate": ""
  },
  "socialLinks": {
    "linkedin": "",
    "github": "",
    "portfolio": ""
  }
}

═══════════════════════════
RULES — FOLLOW ALL OF THEM:
═══════════════════════════

── SKILLS ──────────────────────────────────────────────────────────
What IS a skill: programming languages (Python, Java, TypeScript),
  frameworks (React, Django, Spring Boot), tools (Docker, Figma, Jira),
  platforms (AWS, Azure, GCP), databases (MongoDB, PostgreSQL),
  methodologies (Agile, Scrum, TDD), professional skills (SEO, Financial Modeling).

What is NOT a skill — exclude these completely:
  - People's names (e.g. "Dr. John Smith", "Alice Uwimana")
  - Job titles or role descriptions (e.g. "Instructor of Web3 development",
    "Senior Software Engineer", "Team Leader")
  - Company or university names
  - Generic soft skill phrases that are vague (e.g. "hard worker",
    "good communicator" — only include if they are concrete like "Public Speaking")
  - Sentences or phrases longer than 5 words
  - Anything with a year number in it (e.g. "2 years experience in Java")

── SKILL LEVEL — infer from the ENTIRE resume, do not default everything ──
  Expert    → The skill is the person's primary tool, used across 7+ years, mentioned in
              headline/bio, used in leadership/senior roles, or they have trained others in it.
  Advanced  → Used for 4–6 years, across multiple complex projects or roles, possibly certified.
  Intermediate → Used for 2–3 years in professional settings, appears in several roles/projects.
  Beginner  → Used less than 1 year, mentioned only once, or listed under "learning" / "familiar with".

── YEARS OF EXPERIENCE — calculate from dates in the resume ────────────
  For each skill, look at all job and project entries where it was used.
  Calculate the total months across those entries and convert to years (round to nearest integer).
  If you cannot find date information for a skill → set yearsOfExperience to 0.
  0 means "unknown" — be honest. Never fabricate years.

── EXPERIENCE ──────────────────────────────────────────────────────
  Extract ALL work history. For each role:
  - technologies: list the specific tools/languages mentioned in that role's description
  - isCurrent: true ONLY if the role says "present", "current", "ongoing", or has no end date
  - startDate and endDate: use format "YYYY-MM" or just "YYYY" if only year is given

── EDUCATION ───────────────────────────────────────────────────────
  Extract ALL education entries with institution, degree, field, and years.

── PROJECTS ────────────────────────────────────────────────────────
  Extract ALL projects (personal, academic, professional). Include GitHub links if mentioned.

── LANGUAGES ───────────────────────────────────────────────────────
  Only human spoken languages (English, French, Kinyarwanda, Swahili, etc.)
  NOT programming languages — those go in skills.
  Proficiency: Basic | Conversational | Fluent | Native | Proficient | Elementary | Bilingual

── CERTIFICATIONS ──────────────────────────────────────────────────
  Only formal certifications from recognized issuers (AWS, Google, Coursera, etc.)

── AVAILABILITY ────────────────────────────────────────────────────
  status: "Available" | "Open to Opportunities" | "Not Available"
  type:   "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship"
  If not mentioned → use "Available" and "Full-time"

── SOCIAL LINKS ────────────────────────────────────────────────────
  Extract full URLs for linkedin, github, portfolio from anywhere in the resume.

── GENERAL ─────────────────────────────────────────────────────────
  - bio: copy the Summary / Profile / About section verbatim if present, else ""
  - headline: the person's current job title or professional summary line (1 line max)
  - email: extract exact email. If not found → set to "" (empty string)
  - If any field has no data → use "" for strings, 0 for numbers, [] for arrays
  - Return ONLY the JSON object. Nothing before it, nothing after it.

═══════════════════════════
RESUME TEXT TO PARSE:
═══════════════════════════
${text.slice(0, 16000)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Skill sanitizer — runs on Gemini output to remove bad entries
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
      const wordCount = name.split(/\s+/).length;
      if (wordCount > 5) return false;
      if (/\d{4}/.test(name)) return false;
      if (/^(mr|ms|mrs|dr|prof|rev|sir)\b/i.test(name)) return false;
      const words = name.split(/\s+/);
      if (words.length === 2 && words.every((w: string) => /^[A-Z][a-z]+$/.test(w))) return false;
      if (TITLE_PATTERN.test(name) && wordCount >= 2) return false;
      if (/^(and|or|the|a|an|to|of|for|with|in|on|at)$/i.test(name)) return false;
      return true;
    })
    .map((sk: any) => ({
      name: sk.name.trim(),
      level: VALID_LEVELS.includes(sk.level) ? sk.level : "Intermediate",
      yearsOfExperience:
        typeof sk.yearsOfExperience === "number" && sk.yearsOfExperience >= 0
          ? Math.round(sk.yearsOfExperience)
          : 0,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust JSON parser — same 3-layer repair used by ai.parser.ts for screening.
// Handles: markdown fences, smart/curly quotes, bare newlines inside strings,
// control characters, trailing commas before ] or }.
// Previously parseWithGemini only used a plain JSON.parse — this makes it
// just as resilient as the screening path.
// ─────────────────────────────────────────────────────────────────────────────

const SMART_DOUBLE = new Set([0x201C, 0x201D, 0x201E, 0x201F, 0x2033, 0x2036]);
const SMART_SINGLE = new Set([0x2018, 0x2019, 0x201A, 0x201B, 0x2032, 0x2035]);

function peekNext(s: string, from: number): string {
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (c !== " " && c !== "\t" && c !== "\n" && c !== "\r") return c;
  }
  return "";
}

function isStructural(ch: string): boolean {
  return ch === "," || ch === "}" || ch === "]" || ch === ":";
}

function onePassFix(s: string): string {
  let fixed    = "";
  let inString = false;
  let i        = 0;

  while (i < s.length) {
    const ch   = s[i];
    const code = s.charCodeAt(i);

    // Already-escaped pair — copy verbatim
    if (ch === "\\" && inString) {
      fixed += ch + (s[i + 1] ?? "");
      i += 2;
      continue;
    }

    // Straight double-quote
    if (ch === '"') {
      if (inString) {
        const next = peekNext(s, i + 1);
        if (next && !isStructural(next)) {
          fixed += '\\"';
          i++;
          continue;
        }
      }
      inString = !inString;
      fixed += ch;
      i++;
      continue;
    }

    // Smart / curly DOUBLE quote
    if (SMART_DOUBLE.has(code)) {
      fixed += inString ? '\\"' : '"';
      if (!inString) inString = true;
      i++;
      continue;
    }

    // Smart / curly SINGLE quote → plain apostrophe
    if (SMART_SINGLE.has(code)) {
      fixed += "'";
      i++;
      continue;
    }

    // Inside a string: escape bare whitespace, strip control chars
    if (inString) {
      if (ch === "\n") { fixed += "\\n"; i++; continue; }
      if (ch === "\r") { fixed += "\\r"; i++; continue; }
      if (ch === "\t") { fixed += "\\t"; i++; continue; }
      if (code <= 0x1F || code === 0x7F) { i++; continue; }
    }

    fixed += ch;
    i++;
  }

  return fixed;
}

function parseJsonSafeObject(raw: string): any {
  // Strip markdown fences and JS comments
  let s = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  // Extract the outermost { ... }
  const start = s.indexOf("{");
  const end   = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.substring(start, end + 1);
  }

  const fixed = onePassFix(s).replace(/,\s*([\]}])/g, "$1");

  // Layer 1: fixed string
  try { return JSON.parse(fixed); } catch (_) {}

  // Layer 2: strip non-printable chars
  try {
    return JSON.parse(fixed.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ""));
  } catch (_) {}

  // Layer 3: collapse newlines
  try {
    return JSON.parse(fixed.replace(/\n/g, " ").replace(/\r/g, ""));
  } catch (lastErr) {
    throw new Error(
      `JSON parsing failed.\nLast error: ${(lastErr as Error).message}\nSnippet: ${fixed.slice(0, 400)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Parse with Gemini AI
// Now uses parseJsonSafeObject (3-layer repair) instead of plain JSON.parse
// ─────────────────────────────────────────────────────────────────────────────

async function parseWithGemini(text: string, filename: string): Promise<any | null> {
  try {
    const { callGeminiWithRetry } = await import("./ai.service");
    const raw = await callGeminiWithRetry(PARSE_PROMPT(text), 3);

    let parsed: any;
    try {
      parsed = parseJsonSafeObject(raw);
    } catch (jsonErr: any) {
      console.warn(`⚠️  JSON repair failed for ${filename}: ${jsonErr.message}`);
      return null;
    }

    if (!parsed.firstName && !parsed.lastName && !parsed.email) {
      console.warn(`⚠️  Gemini returned profile with no name/email for ${filename} — using regex fallback`);
      return null;
    }
    parsed.skills         = sanitizeSkills(parsed.skills || []);
    parsed.languages      = Array.isArray(parsed.languages)      ? parsed.languages      : [];
    parsed.experience     = Array.isArray(parsed.experience)     ? parsed.experience     : [];
    parsed.education      = Array.isArray(parsed.education)      ? parsed.education      : [];
    parsed.certifications = Array.isArray(parsed.certifications) ? parsed.certifications : [];
    parsed.projects       = Array.isArray(parsed.projects)       ? parsed.projects       : [];
    const validStatuses = ["Available", "Open to Opportunities", "Not Available"];
    const validTypes    = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
    if (!validStatuses.includes(parsed.availability?.status)) {
      parsed.availability = { ...parsed.availability, status: "Available" };
    }
    if (!validTypes.includes(parsed.availability?.type)) {
      parsed.availability = { ...parsed.availability, type: "Full-time" };
    }
    console.log(
      `✅ Gemini parsed: ${filename} — ${parsed.skills.length} skills, ${parsed.experience.length} roles, ${parsed.projects.length} projects`
    );
    return { ...parsed, source: "external" };
  } catch (error: any) {
    console.error(`❌ Gemini parsing failed for ${filename}:`, error.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Structural regex fallback (only used when Gemini fails)
//
// This is the section that was completely rewritten.
// Before: experience, education, projects, certifications, languages all
//         returned []. Skills only from a hardcoded list.
// After:  full structural section parser — finds every section by header,
//         parses content inside each, handles flexible layouts.
// ─────────────────────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ── Section splitter ────────────────────────────────────────────────────────
// Splits resume text into named sections by detecting ALL-CAPS or Title Case headers
// followed by a newline. Works for the vast majority of real-world CVs.
function splitSections(text: string): Record<string, string> {
  // Header patterns: ALL CAPS line, or Title Case 1-4 word line standing alone
  const SECTION_HEADER = /^(?:[A-Z][A-Z\s&\/\-]{2,40}|(?:[A-Z][a-z]+\s*){1,4})$/;
  const lines = text.split(/\r?\n/);
  const sections: Record<string, string> = { _header: "" };
  let current = "_header";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (SECTION_HEADER.test(line) && line.length <= 50) {
      // Normalise to lowercase key for easy lookup
      const key = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
      if (key.length >= 3) {
        current = key;
        sections[current] = sections[current] || "";
        continue;
      }
    }
    sections[current] = (sections[current] || "") + line + "\n";
  }

  return sections;
}

// ── Find a section by any of the given keyword aliases ─────────────────────
function findSection(sections: Record<string, string>, aliases: string[]): string {
  for (const key of Object.keys(sections)) {
    for (const alias of aliases) {
      if (key.includes(alias)) return sections[key] || "";
    }
  }
  return "";
}

// ── Name ────────────────────────────────────────────────────────────────────
function parseName(lines: string[]): { firstName: string; lastName: string } {
  for (const raw of lines.slice(0, 12)) {
    const line = raw.trim();
    if (!line || line.includes("@") || line.includes("http") || line.length > 80 || line.length < 3) continue;
    // Must look like a name: 2-4 words, each word starts uppercase, only letters/hyphens/apostrophes
    const words = line.split(/\s+/).filter(Boolean);
    if (
      words.length >= 2 && words.length <= 4 &&
      words.every((w) => /^[A-ZÀ-Ÿ][a-zA-Zà-ÿ'\-\.]+$/.test(w))
    ) {
      return {
        firstName: words[0],
        lastName: words.slice(1).join(" "),
      };
    }
  }
  return { firstName: "Unknown", lastName: "Candidate" };
}

// ── Location ────────────────────────────────────────────────────────────────
function parseLocation(text: string, headerLines: string[]): string {
  // 1. Explicit label
  const labeled = text.match(/(?:location|address|city|based in|residing in)[:\s]+([^\n,|]{3,60})/i);
  if (labeled) return labeled[1].trim();

  // 2. Look in header lines for "City, Country" or "City, ST" pattern
  for (const line of headerLines.slice(0, 8)) {
    const m = line.match(/([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)/);
    if (m && m[0].length < 50 && !line.includes("@") && !line.includes("http")) {
      return m[0].trim();
    }
  }
  return "";
}

// ── Headline ────────────────────────────────────────────────────────────────
function parseHeadline(lines: string[]): string {
  const ROLE_WORDS = /engineer|developer|designer|analyst|manager|consultant|architect|scientist|officer|specialist|nurse|teacher|accountant|writer|marketer|director|coordinator|administrator|intern|student/i;
  for (const raw of lines.slice(0, 15)) {
    const line = raw.trim();
    if (line.length < 5 || line.length > 120) continue;
    if (line.includes("@") || /^\d/.test(line)) continue;
    if (ROLE_WORDS.test(line)) return line;
  }
  return "";
}

// ── Bio ─────────────────────────────────────────────────────────────────────
function parseBio(sections: Record<string, string>): string {
  const raw = findSection(sections, ["summary", "profile", "about", "objective", "overview", "professional summary", "career summary"]);
  if (!raw) return "";
  // Take up to 500 chars, clean up
  return raw.replace(/\s+/g, " ").trim().slice(0, 500);
}

// ── Skills ──────────────────────────────────────────────────────────────────
// No more hardcoded list — we extract EVERYTHING from the skills section
// and also scan the entire text for common tech terms dynamically.
function parseSkills(sections: Record<string, string>, fullText: string): any[] {
  const found = new Map<string, any>();

  const skillSection = findSection(sections, [
    "skill", "technical", "competenc", "technolog", "expertise", "tool", "stack", "proficienc",
  ]);

  // Tokens from the skills section
  if (skillSection) {
    skillSection
      .split(/[\n,|•·▪▸▶\-–—;\/\\]/)
      .map((t) => t.trim())
      .filter((t) => {
        if (t.length < 2 || t.length > 40) return false;
        if (/^\d+$/.test(t)) return false;
        if (/\d{4}/.test(t)) return false;
        if ((t.match(/\s/g) || []).length >= 4) return false; // 5+ words
        if (/^(and|or|the|a|an|to|of|for|with|in|on|at|as|is|are|was|were)$/i.test(t)) return false;
        if (/^(mr|ms|mrs|dr|prof)\b/i.test(t)) return false;
        // Skip two Title-Cased words (likely a person name)
        const words = t.split(/\s+/);
        if (words.length === 2 && words.every((w) => /^[A-Z][a-z]+$/.test(w))) return false;
        if (TITLE_PATTERN.test(t) && words.length >= 2) return false;
        return true;
      })
      .forEach((token) => {
        if (!found.has(token.toLowerCase())) {
          found.set(token.toLowerCase(), {
            name: token,
            level: "Intermediate",
            yearsOfExperience: 0,
          });
        }
      });
  }

  // Also scan experience/project sections for technology tokens
  const techSection = findSection(sections, ["experience", "work", "employment", "project"]);
  if (techSection) {
    // Look for "Technologies: X, Y, Z" or "Stack: X, Y, Z" patterns
    const techMatches = techSection.matchAll(/(?:technologies?|tech stack|tools?|stack|built with)[:\s]+([^\n]{3,150})/gi);
    for (const m of techMatches) {
      m[1].split(/[,|]/).map((t) => t.trim()).filter((t) => t.length > 1 && t.length < 35).forEach((token) => {
        if (!found.has(token.toLowerCase())) {
          found.set(token.toLowerCase(), {
            name: token,
            level: "Intermediate",
            yearsOfExperience: 0,
          });
        }
      });
    }
  }

  return Array.from(found.values())
    .filter((sk) => sk.name.trim().length > 0)
    .slice(0, 40);
}

// ── Experience ──────────────────────────────────────────────────────────────
// This was returning [] before. Now does full structural parsing.
function parseExperience(sections: Record<string, string>): any[] {
  const raw = findSection(sections, [
    "experience", "employment", "work history", "professional experience",
    "career", "positions", "work experience",
  ]);
  if (!raw) return [];

  const results: any[] = [];

  // Strategy: split on date patterns which usually precede or follow job entries
  // Pattern: lines containing year ranges like "2020 – 2023", "Jan 2021 - Present", "2021-2022"
  const DATE_RE = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*\d{4}\s*[-–—to]+\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*(?:\d{4}|present|current|ongoing|now)/i;
  const YEAR_ONLY_RE = /\b(19|20)\d{2}\b/;

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Look for a date range on this line or the next 2 lines
    let dateStr = "";
    let dateLineIdx = -1;
    for (let k = i; k < Math.min(i + 3, lines.length); k++) {
      if (DATE_RE.test(lines[k]) || YEAR_ONLY_RE.test(lines[k])) {
        dateStr = lines[k];
        dateLineIdx = k;
        break;
      }
    }

    if (dateStr) {
      // Parse start/end from dateStr
      const years = dateStr.match(/\b(19|20)\d{2}\b/g) || [];
      const isCurrentMatch = /present|current|ongoing|now/i.test(dateStr);
      const startDate = years[0] || "";
      const endDate   = isCurrentMatch ? "Present" : (years[1] || years[0] || "");
      const isCurrent = isCurrentMatch;

      // The role and company are usually on the lines around the date
      // Try the line before dateLineIdx and dateLineIdx itself
      const contextLines = lines.slice(Math.max(0, i), dateLineIdx + 1);
      let role = "";
      let company = "";

      for (const cl of contextLines) {
        if (DATE_RE.test(cl) || YEAR_ONLY_RE.test(cl)) continue;
        if (!role && /engineer|developer|designer|analyst|manager|consultant|architect|intern|officer|specialist|lead|director|coordinator|administrator/i.test(cl)) {
          role = cl.trim();
        } else if (!company && cl.length > 2 && cl.length < 80) {
          company = cl.trim();
        }
      }

      // Description: the lines after the date block until the next date or section
      let descLines: string[] = [];
      let j = dateLineIdx + 1;
      while (j < lines.length && !DATE_RE.test(lines[j]) && !YEAR_ONLY_RE.test(lines[j]) && j < dateLineIdx + 8) {
        if (lines[j].length > 5) descLines.push(lines[j]);
        j++;
      }

      // Technologies: look for explicit tech mentions in description
      const techPattern = /(?:technologies?|tech|tools?|stack|built with|using)[:\s]+([^\n]{3,120})/i;
      const techMatch = descLines.join(" ").match(techPattern);
      const technologies = techMatch
        ? techMatch[1].split(/[,|]/).map((t) => t.trim()).filter((t) => t.length > 1)
        : [];

      if (role || company) {
        results.push({
          company:     company || "Unknown Company",
          role:        role    || "Unknown Role",
          startDate,
          endDate,
          description: descLines.filter((l) => !techPattern.test(l)).join(" ").trim().slice(0, 400),
          technologies,
          isCurrent,
        });
      }

      i = j;
    } else {
      i++;
    }
  }

  return results.slice(0, 10);
}

// ── Education ───────────────────────────────────────────────────────────────
// Was returning [] before. Now parses fully.
function parseEducation(sections: Record<string, string>): any[] {
  const raw = findSection(sections, ["education", "academic", "qualification", "degree"]);
  if (!raw) return [];

  const results: any[] = [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const DEGREE_RE = /\b(bachelor|master|phd|doctorate|diploma|associate|certificate|b\.?sc|m\.?sc|b\.?a|m\.?a|m\.?b\.?a|b\.?eng|m\.?eng|b\.?ed|m\.?ed|b\.?com|honours?|hnd)\b/i;
  const YEAR_RE   = /\b(19|20)\d{2}\b/g;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (DEGREE_RE.test(line) || (line.length > 5 && YEAR_RE.test(line))) {
      const years = [...(line.match(/\b(19|20)\d{2}\b/g) || [])].map(Number);

      // Look for degree
      let degree = "";
      const degreeMatch = line.match(DEGREE_RE);
      if (degreeMatch) {
        degree = cap(degreeMatch[0]);
      }

      // Institution: usually the line before or after
      let institution = "";
      for (const offset of [-1, 1, -2]) {
        const candidate = lines[i + offset]?.trim();
        if (
          candidate &&
          candidate.length > 3 && candidate.length < 100 &&
          !YEAR_RE.test(candidate) &&
          !DEGREE_RE.test(candidate)
        ) {
          institution = candidate;
          break;
        }
      }

      // Field of study: look for "in X" or "of X" pattern in the same line or next
      let fieldOfStudy = "";
      const fieldMatch = (line + " " + (lines[i + 1] || "")).match(/(?:\bin\b|\bof\b)\s+([A-Za-z\s]{3,50}?)(?:\s*,|\s*\(|\n|$)/i);
      if (fieldMatch) fieldOfStudy = fieldMatch[1].trim();

      if (degree || institution) {
        results.push({
          institution: institution || "",
          degree:      degree      || "",
          fieldOfStudy,
          startYear:   years[0] || 0,
          endYear:     years[1] || years[0] || 0,
        });
      }
    }
    i++;
  }

  return results.slice(0, 5);
}

// ── Certifications ──────────────────────────────────────────────────────────
// Was returning [] before.
function parseCertifications(sections: Record<string, string>, fullText: string): any[] {
  const raw = findSection(sections, ["certif", "licens", "accreditation", "credential", "award"]);

  // Also scan fullText for common cert patterns even if no section found
  const searchText = raw || fullText;
  const results: any[] = [];
  const seen = new Set<string>();

  // Pattern: "AWS Certified Solutions Architect", "Google Cloud Professional", etc.
  const CERT_RE = /(?:certified|certification|certificate|professional|associate|specialist|expert)\s+(?:in\s+)?([A-Za-z0-9\s\-+#.]+?)(?:\s*[-–|,\n]|$)/gi;
  const KNOWN_ISSUERS = ["aws", "google", "microsoft", "azure", "cisco", "comptia", "pmi", "oracle", "salesforce", "coursera", "udemy", "linkedin", "ibm", "meta", "cpa", "acca", "cima"];

  let m: RegExpExecArray | null;
  while ((m = CERT_RE.exec(searchText)) !== null) {
    const name = m[0].trim().replace(/\s+/g, " ").slice(0, 100);
    if (name.length < 5 || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    // Try to find issuer
    const contextStart = Math.max(0, m.index - 80);
    const context = searchText.slice(contextStart, m.index + 120).toLowerCase();
    const issuer = KNOWN_ISSUERS.find((iss) => context.includes(iss));

    // Try to find a year near this cert
    const yearMatch = searchText.slice(m.index, m.index + 60).match(/\b(20\d{2})\b/);

    results.push({
      name,
      issuer: issuer ? cap(issuer) : "",
      issueDate: yearMatch ? yearMatch[1] : "",
    });
  }

  // If section was found but CERT_RE didn't match much, also parse line by line
  if (raw && results.length < 3) {
    raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((line) => {
      if (line.length < 5 || seen.has(line.toLowerCase())) return;
      seen.add(line.toLowerCase());
      const yearMatch = line.match(/\b(20\d{2})\b/);
      results.push({
        name: line.replace(/\b(20\d{2})\b/, "").replace(/[-–]/, "").trim().slice(0, 100),
        issuer: "",
        issueDate: yearMatch ? yearMatch[1] : "",
      });
    });
  }

  return results.slice(0, 8);
}

// ── Projects ────────────────────────────────────────────────────────────────
// Was always returning [] before.
function parseProjects(sections: Record<string, string>): any[] {
  const raw = findSection(sections, ["project", "portfolio", "personal project", "side project"]);
  if (!raw) return [];

  const results: any[] = [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const URL_RE = /https?:\/\/[^\s]+/i;
  const TECH_RE = /(?:technologies?|tech|tools?|stack|built with|using)[:\s]+([^\n]{3,120})/i;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // A project name is usually a short Title Case or ALL-CAPS line
    if (line.length < 3 || line.length > 80) { i++; continue; }
    if (/^(and|or|the|a|an)$/i.test(line)) { i++; continue; }

    // Collect description lines that follow
    const descLines: string[] = [];
    let j = i + 1;
    while (j < lines.length && lines[j].length > 3 && j < i + 8) {
      descLines.push(lines[j]);
      j++;
    }

    const allText = [line, ...descLines].join(" ");
    const techMatch = allText.match(TECH_RE);
    const technologies = techMatch
      ? techMatch[1].split(/[,|]/).map((t) => t.trim()).filter((t) => t.length > 1)
      : [];
    const linkMatch = allText.match(URL_RE);

    results.push({
      name:         line,
      description:  descLines.filter((l) => !TECH_RE.test(l)).join(" ").trim().slice(0, 400),
      technologies,
      role:         "",
      link:         linkMatch ? linkMatch[0] : "",
      startDate:    "",
      endDate:      "",
    });

    i = j;
  }

  return results.slice(0, 8);
}

// ── Languages ───────────────────────────────────────────────────────────────
// Was always returning [{ name: "English", proficiency: "Fluent" }] before.
// Now actually reads from the languages section.
function parseLanguages(sections: Record<string, string>, fullText: string): any[] {
  const raw = findSection(sections, ["language", "spoken", "linguistic"]);
  const KNOWN_LANGS = [
    "english","french","kinyarwanda","swahili","kirundi","lingala","amharic","hausa",
    "yoruba","igbo","zulu","afrikaans","arabic","portuguese","spanish","german",
    "chinese","mandarin","cantonese","japanese","korean","hindi","urdu","bengali",
    "turkish","persian","dutch","italian","russian","polish","vietnamese","thai",
  ];
  const PROFICIENCY_RE = /\b(native|fluent|proficient|advanced|intermediate|conversational|basic|beginner|bilingual|elementary|limited)\b/i;
  const PROF_MAP: Record<string, string> = {
    native: "Native", fluent: "Fluent", proficient: "Proficient",
    advanced: "Fluent", intermediate: "Conversational", conversational: "Conversational",
    basic: "Basic", beginner: "Basic", bilingual: "Native",
    elementary: "Basic", limited: "Basic",
  };

  const results: any[] = [];
  const seen = new Set<string>();

  const searchText = raw || fullText.slice(0, 3000);

  for (const lang of KNOWN_LANGS) {
    const re = new RegExp(`\\b${lang}\\b`, "i");
    if (re.test(searchText)) {
      // Look for proficiency near the language mention
      const idx = searchText.toLowerCase().indexOf(lang);
      const context = searchText.slice(Math.max(0, idx - 20), idx + 60);
      const profMatch = context.match(PROFICIENCY_RE);
      const proficiency = profMatch ? PROF_MAP[profMatch[1].toLowerCase()] || "Fluent" : "Fluent";
      if (!seen.has(lang)) {
        seen.add(lang);
        results.push({ name: cap(lang), proficiency });
      }
    }
  }

  return results.length > 0 ? results : [{ name: "English", proficiency: "Fluent" }];
}

// ── Social links ─────────────────────────────────────────────────────────────
function parseSocialLinks(text: string): { linkedin: string; github: string; portfolio: string } {
  const linkedinMatch  = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9_\-]+)/i);
  const githubMatch    = text.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
  const portfolioMatch = text.match(/https?:\/\/(?!linkedin|github)([^\s,)>]{4,80})/i);

  return {
    linkedin:  linkedinMatch  ? `https://linkedin.com/in/${linkedinMatch[1]}`  : "",
    github:    githubMatch    ? `https://github.com/${githubMatch[1]}`          : "",
    portfolio: portfolioMatch ? portfolioMatch[0]                               : "",
  };
}

// ── Phone ────────────────────────────────────────────────────────────────────
function parsePhone(text: string): string {
  const m = text.match(/(?:\+?[\d][\d\s\-(). ]{7,16}\d)/);
  return m ? m[0].trim() : "";
}

// ── Main fallback entry point ─────────────────────────────────────────────────
function regexFallback(text: string, filename: string): any {
  const lines    = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections = splitSections(text);

  // ── Name
  const { firstName, lastName } = parseName(lines);

  // ── Email
  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // ── Phone
  const phone = parsePhone(text);

  // ── Location
  const location = parseLocation(text, lines);

  // ── Headline
  const headline = parseHeadline(lines);

  // ── Bio
  const bio = parseBio(sections);

  // ── Skills (no more hardcoded list — reads from section + tech mentions)
  const skills = parseSkills(sections, text);

  // ── Languages (actually reads the resume now)
  const languages = parseLanguages(sections, text);

  // ── Experience (was always [])
  const experience = parseExperience(sections);

  // ── Education (was always [])
  const education = parseEducation(sections);

  // ── Certifications (was always [])
  const certifications = parseCertifications(sections, text);

  // ── Projects (was always [])
  const projects = parseProjects(sections);

  // ── Social links
  const socialLinks = parseSocialLinks(text);

  console.log(
    `📋 Regex fallback parsed: ${filename} — ${skills.length} skills, ${experience.length} roles, ` +
    `${education.length} education, ${projects.length} projects, ${certifications.length} certs`
  );

  return {
    firstName,
    lastName,
    email,
    phone,
    headline,
    bio,
    location,
    skills,
    languages,
    experience,
    education,
    certifications,
    projects,
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks,
    source: "external",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Throttle Gemini calls — 500ms between calls to avoid rate limits
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastGeminiCallAt = 0;

async function throttledGeminiParse(text: string, filename: string): Promise<any | null> {
  const now = Date.now();
  const timeSinceLast = now - lastGeminiCallAt;
  if (timeSinceLast < 500) {
    await delay(500 - timeSinceLast);
  }
  lastGeminiCallAt = Date.now();
  return parseWithGemini(text, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup helper
// ─────────────────────────────────────────────────────────────────────────────

function cleanupFile(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: parseResumeFile
// Flow: extract text → Cloudinary upload → Gemini parse → regex fallback
// ─────────────────────────────────────────────────────────────────────────────

export async function parseResumeFile(
  filePath: string,
  skipCloudinary = false
): Promise<any> {
  const filename = path.basename(filePath);

  // 1. Extract text
  let rawText = "";
  try {
    rawText = await extractRawText(filePath);
  } catch (err) {
    console.error(`❌ Text extraction failed for ${filename}:`, err);
  }

  // 2. Upload to Cloudinary while the file still exists on disk
  let resumeUrl = "";
  if (!skipCloudinary) {
    try {
      const { uploadResumeToCloud } = await import("./cloudinary.service");
      resumeUrl = await uploadResumeToCloud(filePath, filename);
    } catch (cloudErr: any) {
      console.warn(`⚠️  Cloudinary upload skipped for ${filename}:`, cloudErr.message);
      cleanupFile(filePath);
    }
  } else {
    cleanupFile(filePath);
  }

  // 3. Handle scanned / empty PDFs
  if (!rawText || rawText.trim().length < 40) {
    console.warn(`⚠️  No extractable text in ${filename} — likely a scanned image PDF`);
    const parts = filename
      .replace(/\.(pdf|docx?|txt|odt)$/i, "")
      .replace(/[_-]/g, " ")
      .split(" ");
    return {
      firstName: cap(parts[0] || "Unknown"),
      lastName:  parts.slice(1).map(cap).join(" ") || "Candidate",
      email: "",
      phone: "",
      headline: "Resume uploaded — please review and complete this profile manually",
      bio: "This resume could not be parsed automatically (possibly a scanned image PDF). Please update this profile manually.",
      location: "",
      skills: [],
      languages: [{ name: "English", proficiency: "Fluent" }],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      availability: { status: "Available", type: "Full-time", startDate: "" },
      socialLinks: { linkedin: "", github: "", portfolio: "" },
      source: "external",
      resumeUrl,
    };
  }

  // 4. Try Gemini first (throttled, with retry)
  const geminiResult = await throttledGeminiParse(rawText, filename);
  if (geminiResult) {
    return { ...geminiResult, resumeUrl };
  }

  // 5. Structural regex fallback (Gemini was down or returned bad JSON)
  console.warn(`⚠️  Using regex fallback for: ${filename}`);
  return { ...regexFallback(rawText, filename), resumeUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: parseResumeUrl
// Also upgraded to use parseJsonSafeObject for consistency
// ─────────────────────────────────────────────────────────────────────────────

export async function parseResumeUrl(url: string, rawText: string): Promise<any> {
  const { callGeminiWithRetry } = await import("./ai.service");

  const prompt = `You are an expert resume parser.
Extract a complete structured applicant profile from the text below.
Return ONLY a valid JSON object with no markdown, no backticks, no explanation.

{
  "firstName": "", "lastName": "", "email": "", "headline": "", "bio": "",
  "location": "", "phone": "",
  "skills": [{ "name": "", "level": "Intermediate", "yearsOfExperience": 0 }],
  "languages": [{ "name": "", "proficiency": "Fluent" }],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "", "technologies": [], "isCurrent": false }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": 0, "endYear": 0 }],
  "certifications": [{ "name": "", "issuer": "", "issueDate": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "role": "", "link": "" }],
  "availability": { "status": "Available", "type": "Full-time", "startDate": "" },
  "socialLinks": { "linkedin": "", "github": "", "portfolio": "" }
}

Rules:
- skills: ONLY concrete tools/languages/frameworks/platforms. NOT names, job titles, or sentences.
- skill level: Beginner|Intermediate|Advanced|Expert — infer from context, do not default everything.
- yearsOfExperience: calculate from dates. Use 0 if unknown.
- languages proficiency: Basic|Conversational|Fluent|Native — human languages only.
- availability type: Full-time|Part-time|Contract|Freelance|Internship
- email: exact email from text, or "" if not found.
- Return ONLY the JSON. Nothing else.

Text:
${rawText.slice(0, 14000)}`;

  try {
    const raw    = await callGeminiWithRetry(prompt, 3);
    const parsed = parseJsonSafeObject(raw);
    parsed.skills = sanitizeSkills(parsed.skills || []);
    return { ...parsed, source: "external", resumeUrl: url };
  } catch {
    return { ...regexFallback(rawText.slice(0, 15000), url.split("/").pop() || "url-resume"), resumeUrl: url };
  }
}