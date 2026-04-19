// umurava-backend/src/services/resume.service.ts
//
// Parses PDF, DOCX, DOC, TXT, ODT resume files into structured Umurava
// applicant profiles using pure text extraction + smart keyword analysis.
//
// ✅ ZERO Gemini API calls — works for 1 or 100 files without rate limits.
// ✅ Handles ANY skills (tech, ERP, design, finance, etc.) via dynamic extraction.
// ✅ Falls back gracefully when parsing is partial (scanned PDFs etc.)
// Gemini is only called during SCREENING, not during upload.

import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Extract raw text from file (no AI)
// ─────────────────────────────────────────────────────────────────────────────

async function extractRawText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (ext === ".docx" || ext === ".doc") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
  }

  if (ext === ".odt") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
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

  // Unknown extension — attempt to read as text
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Smart skill extraction (handles ANY field, not just tech)
// Three layers: known tech list + dynamic section extraction + years pattern
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SKILLS: string[] = [
  // Programming languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Ruby", "Dart", "Scala", "R", "Bash", "Shell",
  "MATLAB", "Perl", "Haskell", "Elixir", "Clojure", "F#", "Lua", "Julia",
  // Frontend
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML", "CSS",
  "Tailwind", "Bootstrap", "SASS", "SCSS", "Redux", "GraphQL", "jQuery",
  "Webpack", "Vite", "Three.js", "D3.js",
  // Backend
  "Node.js", "Express", "Django", "FastAPI", "Flask", "Spring Boot",
  "Laravel", "Rails", "ASP.NET", "NestJS", "Fastify", "Hapi", "Koa",
  "Gin", "Echo", "Fiber", "Actix",
  // Mobile
  "Flutter", "React Native", "Android", "iOS", "Xamarin", "Ionic",
  "Swift UI", "Jetpack Compose",
  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "SQLite", "Firebase",
  "DynamoDB", "Cassandra", "Supabase", "Oracle DB", "SQL Server",
  "MariaDB", "CockroachDB", "Elasticsearch", "Neo4j", "InfluxDB",
  // Cloud & DevOps
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible",
  "GitHub Actions", "Jenkins", "CircleCI", "Travis CI", "GitLab CI",
  "Linux", "Nginx", "Apache", "Helm", "Prometheus", "Grafana",
  // AI & Data
  "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
  "Gemini", "OpenAI", "LangChain", "Spark", "Hadoop", "Kafka",
  "Tableau", "Power BI", "Excel", "Looker", "dbt", "Airflow",
  // Design tools
  "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator",
  "InDesign", "Premiere Pro", "After Effects", "AutoCAD", "Blender",
  "Cinema 4D", "Maya", "Canva", "InVision", "Zeplin",
  // Business / ERP / CRM
  "SAP", "Odoo", "QuickBooks", "Salesforce", "HubSpot", "Zoho",
  "Oracle ERP", "NetSuite", "Dynamics 365", "Sage", "Xero",
  "Freshdesk", "Zendesk", "Pipedrive", "Monday.com",
  // Project & collaboration
  "Jira", "Confluence", "Trello", "Notion", "Asana", "ClickUp",
  "Slack", "Teams", "Linear", "Basecamp",
  // Testing
  "Jest", "Cypress", "Selenium", "Playwright", "Pytest", "JUnit",
  "Postman", "k6", "Locust", "Vitest",
  // General engineering concepts
  "REST", "gRPC", "WebSocket", "Microservices", "Serverless",
  "Agile", "Scrum", "Kanban", "TDD", "BDD", "CI/CD", "DevOps",
  "Git", "GitHub", "GitLab", "Bitbucket",
  // Finance & accounting
  "Financial Modeling", "Budgeting", "Forecasting", "IFRS", "GAAP",
  "Risk Management", "Internal Audit", "Tax Planning",
  // Marketing
  "SEO", "SEM", "Google Ads", "Facebook Ads", "Content Marketing",
  "Email Marketing", "Copywriting", "Analytics",
];

function extractContextAround(keyword: string, text: string, chars: number): string {
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return "";
  return text.substring(Math.max(0, idx - chars), Math.min(text.length, idx + chars));
}

function inferSkillLevel(skill: string, text: string): string {
  const ctx = extractContextAround(skill, text, 100).toLowerCase();
  if (/\b(expert|mastery|proficient|extensive|10\+|9\+|8\+|7\+)\b/.test(ctx)) return "Expert";
  if (/\b(advanced|strong|deep|senior|5\+|6\+)\b/.test(ctx)) return "Advanced";
  if (/\b(beginner|basic|learning|familiar|1\+|2\+|entry)\b/.test(ctx)) return "Beginner";
  const mentions = (text.match(new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
  if (mentions >= 5) return "Advanced";
  if (mentions >= 3) return "Intermediate";
  return "Intermediate";
}

function inferYearsForSkill(skill: string, text: string): number {
  const ctx = extractContextAround(skill, text, 120);
  const m = ctx.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  return m ? Math.min(parseInt(m[1]), 25) : 1;
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function extractSkills(text: string): any[] {
  const found = new Map<string, any>();

  // Layer 1 — scan for known tech / tool names
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      found.set(skill.toLowerCase(), {
        name: skill,
        level: inferSkillLevel(skill, text),
        yearsOfExperience: inferYearsForSkill(skill, text),
      });
    }
  }

  // Layer 2 — dynamic extraction from "Skills" / "Technologies" section
  const sectionMatch = text.match(
    /(?:skills?|technical skills?|core competencies|technologies|tools?|expertise|proficiencies)[:\s]*\n([\s\S]{10,800}?)(?:\n{2,}|\n[A-Z][A-Z]|$)/i
  );
  if (sectionMatch) {
    const block = sectionMatch[1];
    const tokens = block
      .split(/[,|\n•·▪▸▶\-–—;\/]/)
      .map((t) => t.replace(/^\W+|\W+$/g, "").trim())
      .filter((t) => t.length >= 2 && t.length <= 50)
      .filter((t) => !/^\d+$/.test(t))
      .filter((t) => !/^(and|or|the|with|for|in|of|a|an|to|at|by)$/i.test(t));

    for (const token of tokens) {
      const key = token.toLowerCase();
      if (!found.has(key) && token.length >= 2) {
        found.set(key, {
          name: token,
          level: inferSkillLevel(token, text),
          yearsOfExperience: inferYearsForSkill(token, text),
        });
      }
    }
  }

  // Layer 3 — "X years of [skill]" pattern anywhere in the text
  const yearsRe = /(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?([A-Za-z][A-Za-z0-9 .+#]{1,35})(?:\s+experience)?[.,\n]/gi;
  let m;
  while ((m = yearsRe.exec(text)) !== null) {
    const yrs = parseInt(m[1]);
    const skillName = m[2].trim();
    const key = skillName.toLowerCase();
    if (skillName.length >= 2 && skillName.length <= 40 && yrs >= 1 && yrs <= 30 && !found.has(key)) {
      found.set(key, {
        name: skillName.charAt(0).toUpperCase() + skillName.slice(1),
        level: yrs >= 7 ? "Expert" : yrs >= 5 ? "Advanced" : yrs >= 3 ? "Intermediate" : "Beginner",
        yearsOfExperience: yrs,
      });
    }
  }

  return Array.from(found.values()).slice(0, 25);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Extract structured fields from raw text
// ─────────────────────────────────────────────────────────────────────────────

function extractName(text: string, filename: string): { firstName: string; lastName: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines.slice(0, 10)) {
    if (
      line.includes("@") || line.includes("http") || line.includes("www.") ||
      line.match(/^\d/) || line.match(/resume|curriculum|cv|profile/i) ||
      line.length > 70 || line.length < 3
    ) continue;

    const words = line.split(/\s+/).filter((w) => w.length > 1);
    if (
      words.length >= 2 && words.length <= 5 &&
      words.every((w) => /^[A-Za-zÀ-ÿ'.-]+$/.test(w))
    ) {
      return { firstName: cap(words[0]), lastName: words.slice(1).map(cap).join(" ") };
    }
  }

  // Fallback: use filename
  const base = filename.replace(/\.(pdf|docx?|txt|odt)$/i, "");
  const parts = base.replace(/[_-]/g, " ").split(" ").filter(Boolean);
  return {
    firstName: cap(parts[0] || "Unknown"),
    lastName: parts.slice(1).map(cap).join(" ") || "Candidate",
  };
}

function extractEmail(text: string, firstName: string): string {
  const m = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : `${firstName.toLowerCase()}.${Date.now()}@resume.uploaded`;
}

function extractPhone(text: string): string {
  const m = text.match(/(\+?\d[\d\s\-().]{7,16}\d)/);
  return m ? m[0].trim() : "";
}

function extractLocation(text: string): string {
  const patterns = [
    /(?:location|address|city|based in|residing in|from)[:\s]+([^\n,|]{5,60})/i,
    /(Kigali|Nairobi|Lagos|Accra|Kampala|Dar es Salaam|Addis Ababa|Johannesburg|Cape Town|Casablanca|Dakar|Abidjan|Lusaka|Harare|Maputo|Kinshasa)[,\s]*(Rwanda|Kenya|Nigeria|Ghana|Uganda|Tanzania|Ethiopia|South Africa|Morocco|Senegal|Ivory Coast|Zambia|Zimbabwe|Mozambique|DRC)?/i,
    /([A-Z][a-z]{2,}),\s+([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?)/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return (m[1] + (m[2] ? `, ${m[2]}` : "")).trim();
  }
  return "";
}

function extractHeadline(text: string): string {
  const keywords = [
    "engineer", "developer", "designer", "manager", "analyst", "architect",
    "lead", "senior", "junior", "full stack", "frontend", "backend", "mobile",
    "data", "devops", "product", "project", "consultant", "specialist",
    "coordinator", "director", "officer", "accountant", "scientist",
    "researcher", "instructor", "educator", "nurse", "doctor",
  ];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 20)) {
    const lower = line.toLowerCase();
    if (
      keywords.some((kw) => lower.includes(kw)) &&
      line.length >= 6 && line.length <= 100 &&
      !line.includes("@") && !line.match(/^\d/)
    ) {
      return line;
    }
  }
  return "";
}

function extractBio(text: string): string {
  const m = text.match(
    /(?:summary|professional summary|profile|about me|objective|career objective|overview)[:\n\r\s]+([^\n]{50,500})/i
  );
  return m ? m[1].trim().slice(0, 500) : "";
}

function extractLanguages(text: string): any[] {
  const map = [
    { name: "English",     kw: ["english"] },
    { name: "French",      kw: ["french", "français", "francais"] },
    { name: "Kinyarwanda", kw: ["kinyarwanda", "kirundi"] },
    { name: "Swahili",     kw: ["swahili", "kiswahili"] },
    { name: "Arabic",      kw: ["arabic"] },
    { name: "Spanish",     kw: ["spanish", "español", "espanol"] },
    { name: "Portuguese",  kw: ["portuguese"] },
    { name: "Mandarin",    kw: ["mandarin", "chinese"] },
    { name: "German",      kw: ["german", "deutsch"] },
    { name: "Japanese",    kw: ["japanese"] },
    { name: "Afrikaans",   kw: ["afrikaans"] },
    { name: "Hausa",       kw: ["hausa"] },
    { name: "Igbo",        kw: ["igbo"] },
    { name: "Yoruba",      kw: ["yoruba"] },
  ];
  const lower = text.toLowerCase();

  function proficiency(lang: string): string {
    const ctx = extractContextAround(lang, lower, 60);
    if (/native|mother tongue|first language/i.test(ctx)) return "Native";
    if (/fluent|advanced|full professional/i.test(ctx)) return "Fluent";
    if (/intermediate|working|professional/i.test(ctx)) return "Conversational";
    if (/basic|beginner|elementary/i.test(ctx)) return "Basic";
    return lang === "english" ? "Fluent" : "Conversational";
  }

  const found = map
    .filter((l) => l.kw.some((kw) => lower.includes(kw)))
    .map((l) => ({ name: l.name, proficiency: proficiency(l.name) }));

  return found.length > 0 ? found : [{ name: "English", proficiency: "Fluent" }];
}

function extractExperience(text: string): any[] {
  const results: any[] = [];
  const sections = text.split(/\n{2,}/);
  const dateRe = /(\d{4}|\w+\s+\d{4})\s*[-–—to]+\s*(\d{4}|present|current|now)/gi;

  for (const section of sections) {
    if (!dateRe.test(section)) continue;
    dateRe.lastIndex = 0;

    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const company = lines[0]?.slice(0, 120) || "";
    const role    = lines[1]?.slice(0, 120) || "";

    if (/university|college|institute|school|bachelor|master|degree|diploma/i.test(company)) continue;

    const yearMatches = section.match(/\d{4}/g) || [];
    const isCurrentMatch = /present|current|now/i.test(section);

    results.push({
      company,
      role,
      startDate:   yearMatches[0] || "",
      endDate:     isCurrentMatch ? "Present" : (yearMatches[1] || yearMatches[0] || ""),
      description: lines.slice(2, 6).join(" ").slice(0, 400) || "",
      technologies: [],
      isCurrent:   isCurrentMatch,
    });

    if (results.length >= 6) break;
  }

  return results;
}

function extractEducation(text: string): any[] {
  const results: any[] = [];
  const degreeRe = [
    /(?:bachelor(?:'s)?|b\.?sc?\.?|b\.?eng?\.?|b\.?a\.?|undergraduate)/i,
    /(?:master(?:'s)?|m\.?sc?\.?|m\.?eng?\.?|m\.?a\.?|mba|postgraduate)/i,
    /(?:ph\.?d\.?|doctorate|doctoral)/i,
    /(?:associate|diploma|certificate|high school|secondary|hnd|ond)/i,
  ];

  const sections = text.split(/\n{2,}/);
  for (const section of sections) {
    if (!degreeRe.some((re) => re.test(section))) continue;
    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
    const years = section.match(/\d{4}/g) || [];

    let degree = "Bachelor's";
    if (/ph\.?d|doctorate/i.test(section))          degree = "PhD";
    else if (/master|m\.sc|m\.eng|mba/i.test(section)) degree = "Master's";
    else if (/associate/i.test(section))                degree = "Associate";
    else if (/diploma/i.test(section))                  degree = "Diploma";
    else if (/certificate/i.test(section))              degree = "Certificate";
    else if (/hnd/i.test(section))                      degree = "HND";

    const fieldMatch = section.match(
      /(?:in|of|:)\s+(computer science|software engineering|information technology|data science|computer engineering|electrical engineering|civil engineering|mechanical engineering|business administration|management|finance|accounting|economics|mathematics|physics|chemistry|biology|medicine|nursing|law|education|graphic design|ux design|ui design|communication|psychology|sociology)/i
    );

    results.push({
      institution:  lines[0]?.slice(0, 120) || "",
      degree,
      fieldOfStudy: fieldMatch ? fieldMatch[1].replace(/\b\w/g, (c) => c.toUpperCase()) : "Not specified",
      startYear:    parseInt(years[0] || "0"),
      endYear:      parseInt(years[1] || years[0] || "0"),
    });

    if (results.length >= 4) break;
  }

  return results;
}

function extractCertifications(text: string): any[] {
  const patterns: [RegExp, string][] = [
    [/\b(AWS Certified[\w\s]+(?:Developer|Architect|Engineer|Practitioner|Specialist)?)/i, "Amazon"],
    [/\b(Google (?:Cloud )?[\w\s]* Certification?)/i, "Google"],
    [/\b(Microsoft (?:Azure|Certified)[\w\s]+)/i, "Microsoft"],
    [/\b(Cisco CCNA[\w\s]*)/i, "Cisco"],
    [/\b(Certified (?:Scrum Master|Product Owner|Data Scientist|Information Systems)[\w\s]*)/i, "Various"],
    [/\b(PMP(?:\s+Certified)?)\b/i, "PMI"],
    [/\b(Oracle (?:Certified|Database)[\w\s]+)/i, "Oracle"],
    [/\b(CompTIA (?:A\+|Network\+|Security\+|CySA\+|PenTest\+)[\w\s]*)/i, "CompTIA"],
    [/\b(CPA|ACCA|CIMA|CFA|CMA|CISA)\b/i, "Professional Body"],
  ];

  const certs: any[] = [];
  for (const [re, issuer] of patterns) {
    const m = text.match(re);
    if (m) {
      certs.push({ name: m[1].trim().slice(0, 100), issuer, issueDate: "" });
    }
  }
  return certs.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Assemble the full applicant profile
// ─────────────────────────────────────────────────────────────────────────────

function buildProfile(text: string, filename: string): any {
  const { firstName, lastName } = extractName(text, filename);
  const email    = extractEmail(text, firstName);
  const phone    = extractPhone(text);
  const location = extractLocation(text);
  const headline = extractHeadline(text);
  const bio      = extractBio(text);
  const skills   = extractSkills(text);
  const languages = extractLanguages(text);
  const experience = extractExperience(text);
  const education  = extractEducation(text);
  const certifications = extractCertifications(text);

  // Social links
  const linkedin  = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const github    = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
  const portfolio = text.match(/https?:\/\/(?!linkedin|github)[\w.-]+\.[\w]{2,}(?:\/[\w./-]*)?/i);

  return {
    firstName,
    lastName,
    email,
    phone: phone || "",
    headline: headline || `${firstName} ${lastName}`,
    bio:      bio || "",
    location: location || "Not specified",
    skills,
    languages,
    experience,
    education,
    certifications,
    projects: [],
    availability: {
      status:    "Available",
      type:      "Full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin:  linkedin  ? `https://linkedin.com/in/${linkedin[1]}`  : "",
      github:    github    ? `https://github.com/${github[1]}`          : "",
      portfolio: portfolio ? portfolio[0]                               : "",
    },
    source: "external",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a single resume file → structured Umurava applicant profile.
 * Zero Gemini calls. Works for any number of files.
 */
export async function parseResumeFile(filePath: string): Promise<any> {
  const filename = path.basename(filePath);

  let rawText = "";
  try {
    rawText = await extractRawText(filePath);
  } catch (err) {
    console.error(`❌ Text extraction failed for ${filename}:`, err);
  }

  // Clean up temp file regardless of extraction outcome
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // non-fatal
  }

  if (!rawText || rawText.trim().length < 40) {
    // Scanned PDF or unreadable file — return a minimal usable profile
    console.warn(`⚠️ Little/no text extracted from ${filename} — may be scanned image PDF`);
    const parts = filename.replace(/\.(pdf|docx?|txt|odt)$/i, "").replace(/[_-]/g, " ").split(" ");
    return {
      firstName:    cap(parts[0] || "Unknown"),
      lastName:     parts.slice(1).map(cap).join(" ") || "Candidate",
      email:        `candidate.${Date.now()}@resume.uploaded`,
      phone:        "",
      headline:     "Resume uploaded — please review and update profile manually",
      bio:          "This resume could not be fully parsed automatically (possibly a scanned image PDF). Please update this profile with the candidate's details.",
      location:     "Not specified",
      skills:       [],
      languages:    [{ name: "English", proficiency: "Fluent" }],
      experience:   [],
      education:    [],
      certifications: [],
      projects:     [],
      availability: { status: "Available", type: "Full-time", startDate: "" },
      socialLinks:  { linkedin: "", github: "", portfolio: "" },
      source:       "external",
    };
  }

  // Limit to 15000 chars to keep memory usage reasonable
  const trimmed = rawText.slice(0, 15000);
  return buildProfile(trimmed, filename);
}

/**
 * Parse a URL-fetched text/HTML document → structured profile.
 * Still uses Gemini for URL content (single call, not a bulk risk).
 * Exported so applicant.controller.ts can use it.
 */
export async function parseResumeUrl(url: string, rawText: string): Promise<any> {
  const { callGeminiWithRetry } = await import("./ai.service");

  const prompt = `Extract a structured applicant profile from this resume/profile text.
Return ONLY a valid JSON object (no markdown, no backticks, no explanation).

{
  "firstName": "", "lastName": "", "email": "", "headline": "", "bio": "",
  "location": "",
  "skills": [{ "name": "", "level": "Intermediate", "yearsOfExperience": 0 }],
  "languages": [{ "name": "", "proficiency": "Fluent" }],
  "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "", "technologies": [], "isCurrent": false }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": 0, "endYear": 0 }],
  "certifications": [{ "name": "", "issuer": "", "issueDate": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [], "role": "" }],
  "availability": { "status": "Available", "type": "Full-time", "startDate": "" },
  "socialLinks": { "linkedin": "", "github": "", "portfolio": "" }
}

Rules:
- Return ONLY the JSON, nothing else
- skills level: Beginner | Intermediate | Advanced | Expert
- languages proficiency: Basic | Conversational | Fluent | Native
- availability status: Available | Open to Opportunities | Not Available
- availability type: Full-time | Part-time | Contract
- isCurrent: true if still working there
- yearsOfExperience: number, 0 if unknown

Text:
${rawText.slice(0, 12000)}`;

  const raw = await callGeminiWithRetry(prompt);
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return { ...parsed, source: "external", resumeUrl: url };
  } catch {
    // If Gemini returns bad JSON, fall back to regex parsing
    return buildProfile(rawText.slice(0, 15000), url.split("/").pop() || "url-resume");
  }
}