import { JobInput, ApplicantInput } from "../types/index";

export function buildScreeningPrompt(job: JobInput, applicants: ApplicantInput[]): string {
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

RETURN ONLY a valid JSON array. No markdown. No explanation. No backticks.

[
  {
    "candidateId": "exact_id_from_input",
    "rank": 1,
    "score": 87,
    "strengths": "2-3 sentences on why this candidate fits the role well",
    "gaps": "1-2 sentences on what they are missing or where they fall short",
    "recommendation": "One sentence final hiring advice",
    "skillsMatched": ["React", "Node.js"],
    "skillsMissing": ["MongoDB"],
    "confidence": "High"
  }
]
`;
}

export function buildComparisonPrompt(job: JobInput, candidates: ApplicantInput[]): string {
  return `
You are an expert AI recruitment assistant.
Compare these ${candidates.length} candidates side-by-side for the job below.

JOB: ${job.title}
Required Skills: ${job.requiredSkills.join(", ")}
Experience needed: ${job.yearsOfExperience} years
Location: ${job.location}

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

IMPORTANT: Optional fields (bio, certifications, socialLinks) — if missing, do NOT penalize.
Score based only on what is present.

Return ONLY this exact JSON. No markdown. No backticks. No text before or after.

{
  "winner": "candidateId_of_best",
  "winnerReason": "2 sentences explaining why this candidate is the best fit",
  "comparison": [
    {
      "candidateId": "...",
      "firstName": "...",
      "lastName": "...",
      "score": 85,
      "topStrength": "Single best quality for this role",
      "biggestGap": "Most significant weakness for this role",
      "verdict": "Strong Fit"
    }
  ]
}

Verdict must be exactly one of: "Strong Fit" | "Good Fit" | "Moderate Fit" | "Weak Fit"
`;
}