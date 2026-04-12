import { JobInput, ApplicantInput } from "../types/index";

export function buildScreeningPrompt(
  job: JobInput,
  applicants: ApplicantInput[]
): string {

  // Format each candidate as clean readable text for AI
  const candidateList = applicants
    .map((a) => {
      const skills = (a.skills ?? [])
        .map((s: any) => `${s.name} (${s.level})`)
        .join(", ");

      const experience = (a.experience ?? [])
        .map((e: any) => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate})`)
        .join(" | ");

      const education = (a.education ?? [])
        .map((e: any) => `${e.degree} in ${e.fieldOfStudy} from ${e.institution}`)
        .join(" | ");

      const projects = (a.projects ?? [])
        .map((p: any) => p.name)
        .join(", ");

      const certs = (a.certifications ?? [])
        .map((c: any) => c.name)
        .join(", ");

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
    })
    .join("\n\n---\n\n");

  return `
You are an expert AI recruitment assistant for Umurava, an African talent platform.
Screen and rank all applicants for the job below. Be fair and skills-first in evaluation.

═══════════════════════════════════════
JOB DETAILS:
═══════════════════════════════════════
Title: ${job.title}
Description: ${job.description ?? "N/A"}
Required Skills: ${(job.requiredSkills ?? []).join(", ")}
Minimum Experience: ${job.yearsOfExperience ?? "Not specified"} years
Education Required: ${job.educationLevel ?? "Not specified"}
Location: ${job.location ?? "Not specified"}

═══════════════════════════════════════
SCORING WEIGHTS (total = 100):
═══════════════════════════════════════
1. Skills Match (40 pts)
   - Match skills[].name against required skills
   - Bonus for Advanced/Expert level on matched skills
   - Bonus for skills used in experience[].technologies

2. Work Experience (25 pts)
   - Sum years from experience[] (startDate to endDate or Present)
   - Relevance of roles to this job
   - Technologies used in experience

3. Education (20 pts)
   - Degree level vs required (PhD > Master > Bachelor > High School)
   - Field of study relevance

4. Extras (15 pts)
   - Location match bonus (up to 5 pts)
   - Languages Fluent/Native = 2 pts each (up to 5 pts)
   - Certifications relevant to job (up to 5 pts)

IMPORTANT — optional field handling:
- If bio, certifications, socialLinks are missing/empty, do NOT penalize
- Treat absent optional fields as neutral
- Score purely on available data

═══════════════════════════════════════
CANDIDATES (${applicants.length} total):
═══════════════════════════════════════
${candidateList}

═══════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════
1. Score every candidate 0-100 using weights above
2. Rank highest score to lowest
3. Return ALL candidates (or TOP 10 if more than 10)
4. skillsMatched = skill names from their skills[] matching required skills
5. skillsMissing = required skills they do NOT have
6. confidence = "High" if score >= 70, "Medium" if 50-69, "Low" if below 50
7. upskillingPaths = suggest free resources for each missing required skill
8. adjacentRoles = other roles this candidate could fit based on their profile

STRICT OUTPUT RULES:
1. Return ONLY a raw JSON array — no markdown, no backticks, no explanation
2. strengths must be a SHORT string (2-3 sentences max)
3. gaps must be a SHORT string (1-2 sentences max)
4. recommendation must be exactly one of: "Shortlist", "Consider", "Not Selected"
5. score must be a number between 0 and 100
6. Use the exact candidateId strings provided — do not change them

RETURN THIS EXACT FORMAT:
[
  {
    "candidateId": "exact_id_from_input",
    "rank": 1,
    "score": 87,
    "strengths": "2-3 sentences about why good fit",
    "gaps": "1-2 sentences about weaknesses",
    "recommendation": "Shortlist",
    "skillsMatched": ["React", "Node.js"],
    "skillsMissing": ["MongoDB"],
    "confidence": "High",
    "upskillingPaths": [
      {
        "skill": "MongoDB",
        "reason": "Required for this role",
        "suggestedResource": "MongoDB University free course at university.mongodb.com"
      }
    ],
    "adjacentRoles": ["Frontend Developer", "React Native Developer"]
  }
]

Rank candidates from highest to lowest score.
Include all ${applicants.length} candidates.
`.trim();
}

// ─────────────────────────────────────────────
// Comparison prompt — 2 to 3 candidates
// ─────────────────────────────────────────────
export function buildComparisonPrompt(
  job: JobInput,
  candidates: ApplicantInput[]
): string {
  const candidateList = candidates
    .map((c) => {
      const skills = (c.skills ?? [])
        .map((s: any) => s.name)
        .join(", ");
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
    })
    .join("\n\n---\n\n");

  return `
  
You are an expert AI recruiter. Compare these candidates for the job below.
Return ONLY a raw JSON object.

JOB:
Title: ${job.title}
Required Skills: ${(job.requiredSkills ?? []).join(", ")}
Years of Experience: ${job.yearsOfExperience ?? "Not specified"}
Location: ${job.location ?? "Not specified"}

CANDIDATES:
${candidateList}

STRICT OUTPUT RULES:
1. Return ONLY a raw JSON object — no markdown, no backticks, no explanation
2. All string values must be plain text with NO quotation marks inside them
3. Arrays of strings should use short phrases (max 10 words each)

RETURN THIS EXACT FORMAT:
{
  "winner": "candidateId of best fit",
  "winnerReason": "One plain sentence explaining why this candidate wins.",
  "comparison": [
    {
      "candidateId": "exact id from input",
      "fullName": "First Last",
      "score": 85,
      "topStrength": "Best quality in one short phrase",
      "biggestGap": "Main weakness in one short phrase",
      "verdict": "Strong Fit"
    }
  ]
}

Verdict options: "Strong Fit", "Good Fit", "Moderate Fit", "Weak Fit"
`.trim();
}