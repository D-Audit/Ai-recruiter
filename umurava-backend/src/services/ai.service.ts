import { geminiModel } from "../config/gemini";
import {
  buildScreeningPrompt,
  buildComparisonPrompt,
} from "../prompts/screening.prompt";
import {
  parseScreeningResponse,
  parseComparisonResponse,
} from "../utils/ai.parser";
import {
  validateResults,
  normalizeScores,
} from "../utils/ai.validator";
import {
  JobInput,
  ApplicantInput,
  ScreeningOutput,
  CandidateResult,
} from "../types/index";

const BIAS_NOTICE = `⚠️ AI Bias Notice: This screening may favor candidates \
with formal education degrees over self-taught developers. \
Skills and project experience should be weighted equally to \
formal credentials. Final decisions must be made by human recruiters.`;

export async function callGeminiWithRetry(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      const is503 =
        error.message?.includes("503") ||
        error.message?.includes("Service Unavailable") ||
        error.message?.includes("overloaded");

      if (is503 && i < retries - 1) {
        const delay = (i + 1) * 2000;
        console.log(`⚠️ Gemini busy — retrying in ${delay / 1000}s (attempt ${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gemini failed after all retries");
}

const BATCH_SIZE = 20;

// ─────────────────────────────────────────────────────────────────
// Screen candidates (batched)
// ─────────────────────────────────────────────────────────────────
export async function screenCandidates(
  job: JobInput,
  applicants: ApplicantInput[]
): Promise<ScreeningOutput> {
  if (!applicants?.length) throw new Error("No applicants provided for screening");

  console.log(`🤖 Screening ${applicants.length} candidates for: ${job.title}`);

  const batches: ApplicantInput[][] = [];
  for (let i = 0; i < applicants.length; i += BATCH_SIZE) {
    batches.push(applicants.slice(i, i + BATCH_SIZE));
  }
  console.log(`📦 ${batches.length} batch(es) × max ${BATCH_SIZE} candidates`);

  let allResults: CandidateResult[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 Batch ${i + 1}/${batches.length} — ${batch.length} candidates`);

    try {
      const prompt      = buildScreeningPrompt(job, batch);
      const rawResponse = await callGeminiWithRetry(prompt);

      let parsed: CandidateResult[];
      try {
        parsed = parseScreeningResponse(rawResponse);
      } catch (parseErr) {
        // Log the full raw response so you can inspect what Gemini returned
        console.error(`❌ Batch ${i + 1} parse error:`, parseErr);
        console.error(`📄 Raw Gemini response (batch ${i + 1}):\n`, rawResponse);
        throw parseErr; // re-throw so the batch-level catch handles it
      }

      const batchIds = batch.map((a) => a.id);
      const { valid, errors } = validateResults(parsed, batchIds);
      if (!valid) console.warn(`⚠️ Batch ${i + 1} validation warnings:`, errors);

      allResults = [...allResults, ...parsed];
      console.log(`✅ Batch ${i + 1} complete — ${parsed.length} candidates scored`);

      // Polite delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      // Continue processing remaining batches even if one fails
    }
  }

  if (allResults.length === 0) {
    throw new Error("AI screening failed — all batches returned errors");
  }

  const normalized    = normalizeScores(allResults);
  const sorted        = normalized.sort((a, b) => b.score - a.score);
  const topCandidates = sorted
    .slice(0, 10)
    .map((c, index) => ({ ...c, rank: index + 1 }));

  console.log(
    `✅ Screening complete — ${topCandidates.length} shortlisted from ${applicants.length} total`
  );

  return {
    jobId:            job.id,
    totalApplicants:  applicants.length,
    shortlistedCount: topCandidates.length,
    rankedCandidates: topCandidates,
    screenedAt:       new Date(),
    biasNotice:       BIAS_NOTICE,
  };
}

// ─────────────────────────────────────────────────────────────────
// Compare 2–3 candidates head-to-head
// ─────────────────────────────────────────────────────────────────
export async function compareCandidates(
  job: JobInput,
  candidates: ApplicantInput[]
): Promise<any> {
  if (candidates.length < 2) throw new Error("Need at least 2 candidates to compare");
  if (candidates.length > 3) throw new Error("Maximum 3 candidates per comparison");

  const prompt = buildComparisonPrompt(job, candidates);
  const text   = await callGeminiWithRetry(prompt);

  let parsed: any;
  try {
    parsed = parseComparisonResponse(text);
  } catch (parseErr) {
    console.error("❌ Comparison parse error:", parseErr);
    console.error("📄 Raw Gemini response:\n", text);
    throw parseErr;
  }

  return { ...parsed, biasNotice: BIAS_NOTICE, comparedAt: new Date() };
}

// ─────────────────────────────────────────────────────────────────
// Recruiter AI chat
// ─────────────────────────────────────────────────────────────────
export async function chatWithRecruiter(message: string, context: any): Promise<string> {
  const prompt = `
You are an expert AI recruitment assistant helping a recruiter make better hiring decisions.

CURRENT SCREENING CONTEXT:
${JSON.stringify(context, null, 2)}

RECRUITER QUESTION:
${message}

Answer clearly, concisely and professionally.
Focus on helping the recruiter make the best hiring decision.
Keep your answer under 150 words.
Do not include any JSON in your response.
Reply in plain conversational English only.
`.trim();

  return callGeminiWithRetry(prompt);
}

// ─────────────────────────────────────────────────────────────────
// Smoke-test Gemini connection
// ─────────────────────────────────────────────────────────────────
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const result = await geminiModel.generateContent('Reply with "OK" only.');
    console.log("✅ Gemini connection OK:", result.response.text());
    return true;
  } catch (error) {
    console.error("❌ Gemini connection failed:", error);
    return false;
  }
}