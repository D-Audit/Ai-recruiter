import { JobInput, ApplicantInput } from "../types/index";

// ─────────────────────────────────────────────────────────────────
// Build the screening prompt
// Key rules passed to Gemini to prevent malformed JSON:
//   1. strengths / gaps must be SHORT string arrays (≤ 10 words each)
//   2. recommendation is one plain sentence — no inner quotes
//   3. No markdown, no explanation outside the JSON
// ─────────────────────────────────────────────────────────────────
export function buildScreeningPrompt(job: JobInput, applicants: ApplicantInput[]): string {
  const jobSummary = `
Job Title: ${job.title}
Description: ${job.description ?? "N/A"}
Required Skills: ${(job.requiredSkills ?? []).join(", ")}
Years of Experience Required: ${job.yearsOfExperience ?? "Not specified"}
Education Level: ${job.educationLevel ?? "Not specified"}
Location: ${job.location ?? "Not specified"}
`.trim();

  const candidateList = applicants.map((a) => {
    const skills      = (a.skills ?? []).map((s: any) => `${s.name} (${s.level})`).join(", ");
    const experience  = (a.experience ?? [])
      .map((e: any) => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate})`)
      .join(" | ");
    const education   = (a.education ?? [])
      .map((e: any) => `${e.degree} in ${e.fieldOfStudy} from ${e.institution}`)
      .join(" | ");
    const projects    = (a.projects ?? []).map((p: any) => p.name).join(", ");
    const certs       = (a.certifications ?? []).map((c: any) => c.name).join(", ");

    return `
CANDIDATE ID: ${a.id}
Name: ${a.firstName} ${a.lastName}
Headline: ${a.headline ?? "N/A"}
Location: ${a.location ?? "N/A"}
Skills: ${skills || "N/A"}
Experience: ${experience || "N/A"}
Education: ${education || "N/A"}
Projects: ${projects || "N/A"}
Certifications: ${certs || "N/A"}
Availability: ${a.availability?.status ?? "N/A"} | ${a.availability?.type ?? "N/A"}
`.trim();
  }).join("\n\n---\n\n");

  return `
You are an expert AI recruitment assistant for Umurava, an African talent platform.
Screen and rank all applicants for the job below. Be fair and skills-first in evaluation.

═══════════════════════════════════════
JOB DETAILS:
═══════════════════════════════════════
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.requiredSkills.join(", ")}
Minimum Experience: ${job.yearsOfExperience} years
Education Required: ${job.educationLevel}
Location: ${job.location}

═══════════════════════════════════════
SCORING WEIGHTS (total = 100):
═══════════════════════════════════════
1. Skills Match (40 pts)
   - Match skills[].name against required skills
   - Bonus for Advanced/Expert level on matched skills
   - Bonus for skills used in experience[].technologies

2. Work Experience (25 pts)
   - Sum years from experience[] (startDate → endDate or Present)
   - Relevance of roles to this job
   - Technologies used in experience

3. Education (20 pts)
   - Degree level vs required (PhD > Master > Bachelor > High School)
   - Field of study relevance

4. Extras (15 pts)
   - Location match bonus (up to 5 pts)
   - Languages (each Fluent/Native relevant language = 2 pts, up to 5 pts)
   - Certifications relevant to job (up to 5 pts)

IMPORTANT — optional field handling:
- If bio, certifications, socialLinks, or portfolioRating are missing/empty, do NOT penalize
- Treat absent optional fields as neutral — score purely on available data
- A candidate with fewer fields is not worse; simply score what is present

═══════════════════════════════════════
CANDIDATES (${applicants.length} total):
═══════════════════════════════════════
${JSON.stringify(applicants, null, 2)}

═══════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════
1. Score every candidate 0-100 using weights above
2. Rank highest score to lowest
3. Return ALL candidates (or TOP 10 if more than 10 provided)
4. skillsMatched = skill names from their skills[] that match required skills
5. skillsMissing = required skills they do NOT have in skills[]
6. confidence = "High" if score >= 70, "Medium" if 50-69, "Low" if below 50
7. NEVER use fullName — use firstName and lastName separately

// Add to the output format in buildScreeningPrompt
RETURN THIS FORMAT ONLY:
[
  {
    "candidateId": "exact_id_from_input",
    "rank": 1,
    "score": 87,
    "strengths": "2-3 sentences",
    "gaps": "1-2 sentences",
    "recommendation": "Shortlist | Consider | Not Selected",
    "skillsMatched": ["React", "Node.js"],
    "skillsMissing": ["MongoDB"],
    "confidence": "High",
    "upskillingPaths": [
      {
        "skill": "MongoDB",
        "reason": "Required for this role",
        "suggestedResource": "MongoDB University free course"
      }
    ],
    "adjacentRoles": ["Frontend Developer", "React Native Developer"]
  }
]

Rank candidates from highest to lowest score. Include all ${applicants.length} candidates.
`.trim();
}

// ─────────────────────────────────────────────────────────────────
// Build the comparison prompt (2–3 candidates)
// ─────────────────────────────────────────────────────────────────
export function buildComparisonPrompt(job: JobInput, candidates: ApplicantInput[]): string {
  const jobSummary = `
Job Title: ${job.title}
Required Skills: ${(job.requiredSkills ?? []).join(", ")}
Years of Experience: ${job.yearsOfExperience ?? "Not specified"}
Location: ${job.location ?? "Not specified"}
`.trim();

  const candidateList = candidates.map((c) => {
    const skills     = (c.skills ?? []).map((s: any) => s.name).join(", ");
    const experience = (c.experience ?? [])
      .map((e: any) => `${e.role} at ${e.company}`)
      .join(" | ");
    return `
ID: ${c.id}
Name: ${c.firstName} ${c.lastName}
Skills: ${skills || "N/A"}
Experience: ${experience || "N/A"}
Location: ${c.location ?? "N/A"}
`.trim();
  }).join("\n\n---\n\n");

  return `
You are an expert AI recruiter. Compare these candidates for the job below. Return ONLY a raw JSON object.

JOB:
${jobSummary}

CANDIDATES:
${candidateList}

STRICT OUTPUT RULES:
1. Return ONLY a raw JSON object. No markdown, no backticks, no explanation.
2. All string values must be plain text — NO quotation marks inside string values.
3. Arrays of strings should use short bullet phrases (max 10 words each).

OUTPUT FORMAT:
{
  "winner": "<candidateId of best fit>",
  "summary": "One plain sentence comparing the candidates.",
  "candidates": [
    {
      "candidateId": "<id>",
      "name": "<first last>",
      "score": <0-100>,
      "pros": ["pro one", "pro two"],
      "cons": ["con one"],
      "verdict": "One plain hiring verdict sentence."
    }
  ],
  "recommendation": "One plain final recommendation sentence."
}
`.trim();
}