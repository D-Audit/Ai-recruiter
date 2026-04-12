import type { ScreeningResult } from "../types";

/** Trimmed payload for recruiter AI chat (token-conscious). */
export function buildScreeningChatContext(
  data: ScreeningResult | null | undefined
): Record<string, unknown> | null {
  if (!data?.jobId || !data.rankedCandidates?.length) return null;

  return {
    jobId: data.jobId,
    screenedAt: data.screenedAt,
    totalApplicants: data.totalApplicants,
    shortlistedCount: data.shortlistedCount,
    biasNotice: data.biasNotice,
    candidates: data.rankedCandidates.map((r) => {
      const c = r.candidateId;
      const name =
        typeof c === "object" && c !== null
          ? `${(c as { firstName?: string }).firstName || ""} ${(c as { lastName?: string }).lastName || ""}`.trim()
          : String(c);
      const id =
        typeof c === "object" && c !== null && "_id" in c
          ? String((c as { _id: string })._id)
          : String(c);
      return {
        id,
        name: name || "Candidate",
        rank: r.rank,
        score: r.score,
        recommendation: r.recommendation,
        strengths: String(r.strengths || "").slice(0, 420),
        gaps: String(r.gaps || "").slice(0, 420),
        skillsMatched: r.skillsMatched,
        skillsMissing: r.skillsMissing,
        confidence: r.confidence,
      };
    }),
  };
}
