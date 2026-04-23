import { JobInput, ApplicantInput } from "../types/index";

export function buildScreeningPrompt(
  job: JobInput,
  applicants: ApplicantInput[]
): string {

  const candidateList = applicants
    .map((a) => {
      const skills = (a.skills ?? [])
        .map((s: any) => `${s.name} (${s.level}, ${s.yearsOfExperience ?? 0}yrs)`)
        .join(", ");

      const experience = (a.experience ?? [])
        .map((e: any) => {
          const end = e.isCurrent ? "Present" : (e.endDate || "?");
          const tech = e.technologies?.length ? ` | Tech: ${e.technologies.join(", ")}` : "";
          return `${e.role} at ${e.company} (${e.startDate ?? "?"} → ${end})${tech}`;
        })
        .join(" || ");

      const education = (a.education ?? [])
        .map((e: any) => `${e.degree} in ${e.fieldOfStudy} at ${e.institution} (${e.startYear ?? "?"}–${e.endYear ?? "?"})`)
        .join(" | ");

      const certs = (a.certifications ?? [])
        .map((c: any) => `${c.name} by ${c.issuer} (${c.issueDate ?? "?"})`)
        .join(", ");

      const projects = (a.projects ?? [])
        .map((p: any) => {
          const tech = p.technologies?.length ? ` [${p.technologies.join(", ")}]` : "";
          return `${p.name}${tech}`;
        })
        .join(", ");

      const langs = (a.languages ?? [])
        .map((l: any) => `${l.name} (${l.proficiency})`)
        .join(", ");

      return `
CANDIDATE_ID: ${a.id}
Name: ${a.firstName} ${a.lastName}
Headline: ${a.headline || "N/A"}
Location: ${a.location || "N/A"}
Skills: ${skills || "N/A"}
Experience: ${experience || "N/A"}
Education: ${education || "N/A"}
Certifications: ${certs || "None"}
Projects: ${projects || "None"}
Languages: ${langs || "None"}
Availability: ${a.availability?.status ?? "N/A"} · ${a.availability?.type ?? "N/A"}
`.trim();
    })
    .join("\n\n---\n\n");

  const requiredSkillsList = (job.requiredSkills ?? []).join(", ") || "Not specified";

  return `
You are a senior AI recruiter for Umurava, an African talent screening platform.
Your task: score and rank ALL ${applicants.length} candidates for the job below.
Be rigorous, fair, and skills-first. Base every score on REAL data in each profile.

════════════════════════════════════════
JOB REQUIREMENTS
════════════════════════════════════════
Title: ${job.title}
Description: ${job.description || "N/A"}
Required Skills: ${requiredSkillsList}
Minimum Experience: ${job.yearsOfExperience ?? 0} years
Education Required: ${job.educationLevel || "Any"}
Location: ${job.location || "Not specified"}
Job Type: ${(job as any).jobType || "Not specified"}

════════════════════════════════════════
SCORING RUBRIC (total = 100 points)
════════════════════════════════════════

SKILLS MATCH — 40 pts
• For each required skill the candidate has: award (40 / totalRequiredSkills) pts
• +3 bonus if skill level is Advanced or Expert
• +2 bonus if that skill appears in experience[].technologies
• Candidate with ALL required skills should score 35–40 in this category
• Candidate missing ALL required skills scores 0

WORK EXPERIENCE — 25 pts
• Calculate total years: sum each experience entry's duration
  - Use startDate to endDate or "Present"; treat "Present" as today
  - Example: 2021-01 to Present (2026-04) = ~5 years
• Award: min(actualYears, requiredYears + 2) / (requiredYears + 2) * 20 pts
• +5 pts if recent roles (last 3 years) match this job's domain
• +3 bonus for leadership or senior titles if role requires it

EDUCATION — 20 pts
• PhD = 20 pts, Master's = 16 pts, Bachelor's = 12 pts, High School = 6 pts
• If candidate's degree level meets or exceeds required: full credit
• If field of study directly matches: no deduction
• If field is unrelated: -3 pts

EXTRAS — 15 pts
• Location match (job location vs candidate location): 0–5 pts
  - Same city = 5 pts, Same country = 3 pts, Different = 0 pts
• Languages Fluent/Native relevant to job location: 2 pts each (max 5 pts)
• Relevant certifications (matching job domain): 2–5 pts

IMPORTANT RULES:
- Do NOT penalize missing optional fields (bio, portfolio, socialLinks)
- A strong skills+experience match MUST produce a score of 70+
- Score 85+ only if ALL required skills match AND experience exceeds minimum
- Never give the same score to two different candidates
- Scores must reflect real relative ranking — spread them out

════════════════════════════════════════
CANDIDATES (${applicants.length} total)
════════════════════════════════════════
${candidateList}

════════════════════════════════════════
OUTPUT INSTRUCTIONS
════════════════════════════════════════
- Return ALL ${applicants.length} candidates
- Sort by score descending (rank 1 = highest score)
- strengths: 2–3 specific sentences referencing ACTUAL skills/experience from profile
- gaps: 1–2 sentences on what they're missing vs job requirements
- recommendation: EXACTLY "Shortlist" (score ≥ 70), "Consider" (50–69), "Not Selected" (< 50)
- confidence: "High" (score ≥ 70), "Medium" (50–69), "Low" (< 50)
- skillsMatched: array of skill names from their profile that appear in requiredSkills
- skillsMissing: required skills NOT found in their profile at all
- upskillingPaths: for each missing required skill, suggest a specific free resource
- adjacentRoles: 2–4 roles this candidate is also well-suited for based on their full profile

STRICT OUTPUT FORMAT:
Return ONLY a raw JSON array. No markdown, no backticks, no explanation.

[
  {
    "candidateId": "exact_id_from_input",
    "rank": 1,
    "score": 88,
    "strengths": "Specific 2-3 sentences referencing actual data from the profile.",
    "gaps": "Specific 1-2 sentences on what is missing.",
    "recommendation": "Shortlist",
    "skillsMatched": ["React", "Node.js"],
    "skillsMissing": ["MongoDB"],
    "confidence": "High",
    "upskillingPaths": [
      {
        "skill": "MongoDB",
        "reason": "Required for this role — not found in candidate profile",
        "suggestedResource": "MongoDB University free course at university.mongodb.com"
      }
    ],
    "adjacentRoles": ["Full Stack Developer", "React Native Developer"]
  }
]
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
      const skills = (c.skills ?? []).map((s: any) => `${s.name} (${s.level})`).join(", ");
      const experience = (c.experience ?? [])
        .map((e: any) => `${e.role} at ${e.company} (${e.startDate ?? "?"} → ${e.isCurrent ? "Present" : e.endDate ?? "?"})`)
        .join(" | ");
      const education = (c.education ?? [])
        .map((e: any) => `${e.degree} in ${e.fieldOfStudy}`)
        .join(", ");
      const certs = (c.certifications ?? []).map((cert: any) => cert.name).join(", ");
      return `
ID: ${c.id}
Name: ${c.firstName} ${c.lastName}
Headline: ${c.headline || "N/A"}
Location: ${c.location || "N/A"}
Skills: ${skills || "N/A"}
Experience: ${experience || "N/A"}
Education: ${education || "N/A"}
Certifications: ${certs || "None"}
Availability: ${c.availability?.status ?? "N/A"}
`.trim();
    })
    .join("\n\n---\n\n");

  return `
You are an expert AI recruiter. Compare these ${candidates.length} candidates for the job below.
Be direct, specific, and reference actual profile data. Return ONLY a raw JSON object.

JOB:
Title: ${job.title}
Required Skills: ${(job.requiredSkills ?? []).join(", ") || "Not specified"}
Minimum Experience: ${job.yearsOfExperience ?? 0} years
Education Required: ${job.educationLevel || "Any"}
Location: ${job.location || "Not specified"}

CANDIDATES:
${candidateList}

RULES:
1. Return ONLY a raw JSON object — no markdown, no backticks, no explanation
2. winner must be the candidateId of the objectively best fit
3. winnerReason must reference specific skills or experience
4. score each candidate 0-100 based on job fit (use same rubric as full screening)
5. topStrength and biggestGap must be specific, not generic

RETURN THIS EXACT FORMAT:
{
  "winner": "candidateId",
  "winnerReason": "One specific sentence citing skills/experience why they win.",
  "comparison": [
    {
      "candidateId": "exact id",
      "fullName": "First Last",
      "score": 85,
      "topStrength": "Specific strength in short phrase",
      "biggestGap": "Specific gap in short phrase",
      "verdict": "Strong Fit"
    }
  ]
}

Verdict options (based on score): "Strong Fit" (≥80), "Good Fit" (65-79), "Moderate Fit" (50-64), "Weak Fit" (<50)
`.trim();
}