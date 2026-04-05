import { CandidateResult } from "../types/index";

export function validateResults(
  results: CandidateResult[],
  applicantIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(results) || results.length === 0) {
    errors.push("Results must be a non-empty array");
    return { valid: false, errors };
  }

  results.forEach((c, i) => {
    if (!c.candidateId) errors.push(`Index ${i}: missing candidateId`);
    if (typeof c.score !== "number" || c.score < 0 || c.score > 100) {
      errors.push(`${c.candidateId}: invalid score ${c.score}`);
    }
    if (!c.strengths) errors.push(`${c.candidateId}: missing strengths`);
    if (!c.gaps) errors.push(`${c.candidateId}: missing gaps`);
  });

  return { valid: errors.length === 0, errors };
}

export function normalizeScores(
  results: CandidateResult[]
): CandidateResult[] {
  return results
    .map((c) => ({
      ...c,
      score: Math.min(100, Math.max(0, Math.round(c.score))),
      rank: Math.max(1, c.rank),
    }))
    .sort((a, b) => a.rank - b.rank);
}