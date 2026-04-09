import { JobInput, ApplicantInput } from "../types/index";

export function buildScreeningPrompt(
  job: JobInput,
  applicants: ApplicantInput[]
): string {
  return `
You are an expert AI recruitment assistant for Umurava, 
an African talent platform.

Your task is to screen and rank job applicants.

═══════════════════════════════════
JOB DETAILS:
═══════════════════════════════════
Title: ${job.title}
Description: ${job.description}
Required Skills: ${job.requiredSkills.join(", ")}
Experience Required: ${job.yearsOfExperience} years
Education Required: ${job.educationLevel}
Location: ${job.location}

═══════════════════════════════════
SCORING (Total 100 points):
═══════════════════════════════════
Skills Match     → 40 points
Experience       → 25 points  
Education        → 20 points
Location/Language→ 15 points

═══════════════════════════════════
CANDIDATES (${applicants.length} total):
═══════════════════════════════════
${JSON.stringify(applicants, null, 2)}

═══════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════
1. Score every candidate 0-100
2. Rank highest to lowest
3. Return TOP 10 only
4. Be fair and objective

RULES:
- Return ONLY valid JSON array
- No text before or after JSON
- No markdown code blocks
- Use exact candidateId from input

RETURN THIS FORMAT ONLY:
[
  {
    "candidateId": "exact_id_from_input",
    "rank": 1,
    "score": 87,
    "strengths": "2-3 sentences about why good fit",
    "gaps": "1-2 sentences about weaknesses",
    "recommendation": "1 sentence final advice",
    "skillsMatched": ["React", "Node.js"],
    "skillsMissing": ["MongoDB"]
  }
]
`;
}

export function buildComparisonPrompt(
  job: JobInput,
  candidates: ApplicantInput[]
): string {
  return `
  
You are an expert AI recruitment assistant.
Compare these ${candidates.length} candidates for this job.

JOB: ${job.title}
Required Skills: ${job.requiredSkills.join(", ")}
Experience: ${job.yearsOfExperience} years

CANDIDATES:
${JSON.stringify(candidates, null, 2)}

Return ONLY this JSON, no extra text:
{
  "winner": "candidateId_of_best",
  "winnerReason": "Why best in 2 sentences",
  "comparison": [
    {
      "candidateId": "...",
      "fullName": "...",
      "score": 85,
      "topStrength": "Best quality",
      "biggestGap": "Main weakness",
      "verdict": "Strong Fit"
    }
  ]
}
Verdict options: "Strong Fit","Good Fit","Moderate Fit","Weak Fit"
`;
}