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
You are an expert AI recruiter. Evaluate the candidates below against the job and return ONLY a valid JSON array.

JOB:
${jobSummary}

CANDIDATES:
${candidateList}

STRICT OUTPUT RULES — FOLLOW EXACTLY:
1. Return ONLY a raw JSON array. No markdown, no backticks, no explanation.
2. "strengths" must be an ARRAY of short bullet strings (max 10 words each, max 4 items).
3. "gaps" must be an ARRAY of short bullet strings (max 10 words each, max 3 items).
4. "recommendation" must be one plain sentence with NO quotation marks inside it.
5. "confidence" must be exactly one of: "High", "Medium", or "Low".
6. Do NOT use quotation marks (" or ') inside any string value.
7. "score" must be a number between 0 and 100.
8. Use the exact candidateId strings provided — do not change them.

OUTPUT FORMAT (one object per candidate):
[
  {
    "candidateId": "<exact id from input>",
    "rank": <integer starting from 1>,
    "score": <number 0-100>,
    "strengths": ["strength one", "strength two", "strength three"],
    "gaps": ["gap one", "gap two"],
    "recommendation": "One plain sentence recommendation without any inner quotes.",
    "skillsMatched": ["Skill1", "Skill2"],
    "skillsMissing": ["Skill3"],
    "confidence": "High"
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