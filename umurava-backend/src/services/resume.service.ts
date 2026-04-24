// umurava-backend/src/services/resume.service.ts
//
// ✅ Gemini AI parses everything — skill level, years, experience, projects
// ✅ Improved prompt: Gemini infers skill level from context, not just defaults
// ✅ Skill sanitization: removes names, job titles, bad entries from Gemini output
// ✅ Regex fallback: no more "Dr. Awet Fesseha" as a skill, yearsOfExperience: 0 when unknown
// ✅ Retry with exponential backoff — handles 503/429/network errors
// ✅ Cloudinary upload before cleanup
// ✅ Scanned PDFs handled gracefully

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
  
  Apply this logic per skill: if Python is in every job for 5 years → Advanced.
  If React is in only one recent 1-year role → Intermediate. If "exploring Rust" → Beginner.
  Do NOT set everything to Intermediate. Differentiate based on evidence in the resume.

── YEARS OF EXPERIENCE — calculate from dates in the resume ────────────
  For each skill, look at all job and project entries where it was used.
  Calculate the total months across those entries and convert to years (round to nearest integer).
  Example: if React was used in 2021-2022 (1 year) and 2023-2024 (1 year) = 2 years total.
  If you cannot find date information for a skill → set yearsOfExperience to 0 (NOT 1, NOT 2).
  0 means "unknown" — be honest. Never fabricate years.

── EXPERIENCE ──────────────────────────────────────────────────────
  Extract ALL work history. For each role:
  - technologies: list the specific tools/languages mentioned in that role's description
  - isCurrent: true ONLY if the role says "present", "current", "ongoing", or has no end date
    in the context of being the latest role
  - startDate and endDate: use format "YYYY-MM" or just "YYYY" if only year is given

── EDUCATION ───────────────────────────────────────────────────────
  Extract ALL education entries with institution, degree, field, and years.

── PROJECTS ────────────────────────────────────────────────────────
  Extract ALL projects (personal, academic, professional). Include GitHub links if mentioned.

── LANGUAGES ───────────────────────────────────────────────────────
  Only human spoken languages (English, French, Kinyarwanda, Swahili, etc.)
  NOT programming languages — those go in skills.
  Proficiency: Basic | Conversational | Fluent | Native | Proficient | Elementary | Bilingual | Limited Working Proficiency | Professional Working Proficiency

── CERTIFICATIONS ──────────────────────────────────────────────────
  Only formal certifications from recognized issuers (AWS, Google, Coursera, etc.)
  Not courses or online tutorials unless they give a certificate.

── AVAILABILITY ────────────────────────────────────────────────────
  status: "Available" | "Open to Opportunities" | "Not Available"
  type:   "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship"
  If not mentioned → use "Available" and "Full-time"

── SOCIAL LINKS ────────────────────────────────────────────────────
  Extract full URLs for linkedin, github, portfolio from anywhere in the resume.

── GENERAL ─────────────────────────────────────────────────────────
  - bio: copy the Summary / Profile / About section verbatim if present, else ""
  - headline: the person's current job title or professional summary line (1 line max)
  - email: extract exact email. If not found → set to "" (empty string, do NOT make one up)
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

// Words that strongly suggest something is a job title / description, not a skill
const TITLE_PATTERN = /\b(instructor|teacher|manager|director|coordinator|developer|engineer|analyst|officer|specialist|consultant|executive|president|founder|lead|head|chief)\b/i;

function sanitizeSkills(skills: any[]): any[] {
  if (!Array.isArray(skills)) return [];

  return skills
    .filter((sk: any) => {
      if (!sk || typeof sk.name !== "string") return false;
      const name = sk.name.trim();

      // Too short or too long
      if (name.length < 2 || name.length > 45) return false;

      // More than 5 words — not a skill name
      const wordCount = name.split(/\s+/).length;
      if (wordCount > 5) return false;

      // Contains a 4-digit year
      if (/\d{4}/.test(name)) return false;

      // Starts with an honorific — it's a person's name
      if (/^(mr|ms|mrs|dr|prof|rev|sir)\b/i.test(name)) return false;

      // Looks like a person name: two capitalised words not separated by special chars
      // e.g. "Andy Melvin", "Awet Fesseha"
      const words = name.split(/\s+/);
      if (
        words.length === 2 &&
        words.every((w: string) => /^[A-Z][a-z]+$/.test(w))
      ) {
        return false;
      }

      // Job title pattern (e.g. "Instructor of Web3 development")
      if (TITLE_PATTERN.test(name) && wordCount >= 2) return false;

      // Conjunction/article only
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
// STEP 2 — Parse with Gemini AI
// ─────────────────────────────────────────────────────────────────────────────

async function parseWithGemini(text: string, filename: string): Promise<any | null> {
  try {
    const { callGeminiWithRetry } = await import("./ai.service");
    const raw = await callGeminiWithRetry(PARSE_PROMPT(text), 3);

    // Strip accidental markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Must have at least a name or email
    if (!parsed.firstName && !parsed.lastName && !parsed.email) {
      console.warn(`⚠️  Gemini returned profile with no name/email for ${filename} — using regex fallback`);
      return null;
    }

    // Sanitize skills regardless of how Gemini returned them
    parsed.skills = sanitizeSkills(parsed.skills || []);

    // Ensure all arrays exist
    parsed.languages     = Array.isArray(parsed.languages)     ? parsed.languages     : [];
    parsed.experience    = Array.isArray(parsed.experience)    ? parsed.experience    : [];
    parsed.education     = Array.isArray(parsed.education)     ? parsed.education     : [];
    parsed.certifications= Array.isArray(parsed.certifications)? parsed.certifications: [];
    parsed.projects      = Array.isArray(parsed.projects)      ? parsed.projects      : [];

    // Sanitize availability
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
// STEP 3 — Regex fallback (only used when Gemini fails)
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SKILLS: string[] = [
  "JavaScript","TypeScript","Python","Java","C++","C#","Go","Rust","Swift","Kotlin","PHP",
  "Ruby","Dart","Scala","R","Bash","Shell","MATLAB","Perl","React","Next.js","Vue.js",
  "Angular","Svelte","HTML","CSS","Tailwind","Bootstrap","SASS","Redux","GraphQL","jQuery",
  "Vite","Node.js","Express","Django","FastAPI","Flask","Spring Boot","Laravel","NestJS",
  "Flutter","React Native","Android","iOS","MongoDB","PostgreSQL","MySQL","Redis","SQLite",
  "Firebase","DynamoDB","Supabase","Oracle DB","SQL Server","Elasticsearch","AWS","Azure",
  "GCP","Docker","Kubernetes","Terraform","Ansible","GitHub Actions","Jenkins","Linux",
  "Nginx","Prometheus","Grafana","TensorFlow","PyTorch","scikit-learn","Pandas","NumPy",
  "Gemini","OpenAI","LangChain","Spark","Kafka","Tableau","Power BI","Excel","Figma",
  "Adobe XD","Photoshop","Illustrator","Canva","SAP","Odoo","QuickBooks","Salesforce",
  "HubSpot","Zoho","NetSuite","Jira","Confluence","Trello","Notion","Asana","Slack",
  "Jest","Cypress","Selenium","Playwright","Postman","REST","Microservices","Web3",
  "Solidity","Blockchain","Agile","Scrum","Git","GitHub","GitLab","Bitbucket",
  "Financial Modeling","IFRS","GAAP","SEO","SEM","Google Analytics","Public Speaking",
  "Project Management","Product Management","Data Analysis","Machine Learning",
  "Deep Learning","Computer Vision","NLP","DevOps","CI/CD","Version Control",
  "Cloud Computing","Cybersecurity","Network Administration","SQL","NoSQL",
];

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function regexFallback(text: string, filename: string): any {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Name — look in first 10 lines
  let firstName = "Unknown", lastName = "Candidate";
  for (const line of lines.slice(0, 10)) {
    if (line.includes("@") || line.includes("http") || line.length > 70 || line.length < 3) continue;
    const words = line.split(/\s+/).filter(w => w.length > 1);
    if (words.length >= 2 && words.length <= 5 && words.every(w => /^[A-Za-zÀ-ÿ'.-]+$/.test(w))) {
      firstName = cap(words[0]);
      lastName = words.slice(1).map(cap).join(" ");
      break;
    }
  }

  const emailMatch = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  // Use empty string if no email found — do NOT fabricate
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // Skills — match only from the known list (safe, no false positives)
  const found = new Map<string, any>();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      found.set(skill.toLowerCase(), {
        name: skill,
        level: "Intermediate",
        yearsOfExperience: 0, // honest unknown — not fabricated
      });
    }
  }

  // Also scan explicit Skills sections but with strict filtering
  const sectionMatch = text.match(
    /(?:skills?|technical skills?|core competencies|technologies|expertise|tools)[:\s]*\n([\s\S]{10,600}?)(?:\n{2,}|(?=\n[A-Z][^\n]{2,}\n)|$)/i
  );
  if (sectionMatch) {
    sectionMatch[1]
      .split(/[,|\n•·▪▸▶\-–—;\/]/)
      .map(t => t.trim())
      .filter(t => {
        if (t.length < 2 || t.length > 35) return false;
        if (/^\d+$/.test(t)) return false;
        if (/^(mr|ms|mrs|dr|prof)\b/i.test(t)) return false;
        if ((t.match(/\s/g) || []).length >= 4) return false; // 5+ words
        if (/^(and|or|the|a|an|to|of|for|with|in|on|at)$/i.test(t)) return false;
        if (/\d{4}/.test(t)) return false;
        if (TITLE_PATTERN.test(t) && t.split(" ").length >= 2) return false;
        // Exclude likely person names (Two Title-Cased Words)
        const words = t.split(/\s+/);
        if (words.length === 2 && words.every((w: string) => /^[A-Z][a-z]+$/.test(w))) return false;
        return true;
      })
      .forEach(token => {
        if (!found.has(token.toLowerCase())) {
          found.set(token.toLowerCase(), {
            name: token,
            level: "Intermediate",
            yearsOfExperience: 0,
          });
        }
      });
  }

  const skills = Array.from(found.values()).slice(0, 30);

  return {
    firstName,
    lastName,
    email,
    phone: (text.match(/(\+?[\d][\d\s\-(). ]{7,16}\d)/)?.[0] || "").trim(),
    headline:
      lines
        .slice(0, 20)
        .find(
          l =>
            /engineer|developer|designer|manager|analyst|consultant|nurse|teacher|architect/i.test(l) &&
            l.length < 100
        ) || "",
    bio:
      (
        text.match(
          /(?:summary|profile|about me|objective|professional summary)[:\n\r\s]+([^\n]{50,500})/i
        )?.[1] || ""
      ).trim(),
    location:
      (
        text.match(/(?:location|city|based in|address)[:\s]+([^\n,|]{5,60})/i)?.[1] || ""
      ).trim(),
    skills,
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: {
      linkedin: text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i)
        ? `https://linkedin.com/in/${text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i)![1]}`
        : "",
      github: text.match(/github\.com\/([a-zA-Z0-9_-]+)/i)
        ? `https://github.com/${text.match(/github\.com\/([a-zA-Z0-9_-]+)/i)![1]}`
        : "",
      portfolio: "",
    },
    source: "external",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Throttle Gemini calls — 500ms between calls to avoid rate limits
// ─────────────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
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
      // cloudinary.service deletes the local file itself after upload
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
      lastName: parts.slice(1).map(cap).join(" ") || "Candidate",
      email: "",
      phone: "",
      headline: "Resume uploaded — please review and complete this profile manually",
      bio: "This resume could not be parsed automatically (possibly a scanned image PDF or image-only file). Please update this profile manually.",
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

  // 5. Regex fallback (Gemini was down or returned bad JSON)
  console.warn(`⚠️  Using regex fallback for: ${filename}`);
  return { ...regexFallback(rawText, filename), resumeUrl };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: parseResumeUrl
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
- languages proficiency: Basic|Elementary|Conversational|Proficient|Fluent|Bilingual|Native|Limited Working Proficiency|Professional Working Proficiency — human languages only.
- availability type: Full-time|Part-time|Contract|Freelance|Internship
- email: exact email from text, or "" if not found.
- Return ONLY the JSON. Nothing else.

Text:
${rawText.slice(0, 14000)}`;

  try {
    const raw    = await callGeminiWithRetry(prompt, 3);
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    parsed.skills = sanitizeSkills(parsed.skills || []);
    return { ...parsed, source: "external", resumeUrl: url };
  } catch {
    return { ...regexFallback(rawText.slice(0, 15000), url.split("/").pop() || "url-resume"), resumeUrl: url };
  }
}