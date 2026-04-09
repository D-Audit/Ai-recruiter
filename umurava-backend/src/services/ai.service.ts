import { geminiModel } from "../config/gemini";
import {
  buildScreeningPrompt,
  buildComparisonPrompt,
} from "../prompts/screening.prompt";
import { parseScreeningResponse, parseComparisonResponse } from "../utils/ai.parser";
import { validateResults, normalizeScores } from "../utils/ai.validator";
import { JobInput, ApplicantInput, ScreeningOutput } from "../types/index";

const BIAS_NOTICE =
  "⚠️ AI screening is a support tool only. Final hiring decisions " +
  "must always be made by qualified human recruiters. AI may not " +
  "capture soft skills, cultural fit, or personal context.";

export async function screenCandidates(
  job: JobInput,
  applicants: ApplicantInput[]
): Promise<ScreeningOutput> {
  console.log(`🤖 Screening ${applicants.length} candidates for: ${job.title}`);

  if (!applicants || applicants.length === 0) {
    throw new Error("No applicants provided for screening");
  }

  const prompt = buildScreeningPrompt(job, applicants);

  let rawResponse: string;
  try {
    const result = await geminiModel.generateContent(prompt);
    rawResponse = result.response.text();
    console.log("✅ Gemini responded");
  } catch (error) {
    throw new Error(`Gemini API error: ${error}`);
  }

  const parsed = parseScreeningResponse(rawResponse);
  const applicantIds = applicants.map((a) => a.id);
  const { valid, errors } = validateResults(parsed, applicantIds);

  if (!valid) console.warn("⚠️ Validation warnings:", errors);

  const normalized = normalizeScores(parsed);

  return {
    jobId: job.id,
    totalApplicants: applicants.length,
    shortlistedCount: normalized.length,
    rankedCandidates: normalized,
    screenedAt: new Date(),
    biasNotice: BIAS_NOTICE,
  };
}

export async function compareCandidates(
  job: JobInput,
  candidates: ApplicantInput[]
): Promise<any> {
  if (candidates.length < 2) throw new Error("Need at least 2 candidates");
  if (candidates.length > 3) throw new Error("Maximum 3 candidates");

  const prompt = buildComparisonPrompt(job, candidates);
  const result = await geminiModel.generateContent(prompt);
  const parsed = parseComparisonResponse(result.response.text());

  return { ...parsed, biasNotice: BIAS_NOTICE, comparedAt: new Date() };
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const result = await geminiModel.generateContent('Say "OK" only.');
    console.log("✅ Gemini test:", result.response.text());
    return true;
  } catch (error) {
    console.error("❌ Gemini test failed:", error);
    return false;
  }
}