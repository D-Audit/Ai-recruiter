// umurava-backend/src/services/ai.service.ts

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

// ─────────────────────────────────────────────────────────────────────────────
// callGeminiWithRetry — exponential backoff, preserves real error type
// ─────────────────────────────────────────────────────────────────────────────
export async function callGeminiWithRetry(
  prompt: string,
  retries = 3
): Promise<string> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text   = result.response.text();
      if (!text || text.trim().length === 0) {
        throw new Error("Gemini returned an empty response");
      }
      return text;
    } catch (error: any) {
      lastError = error;

      const msg    = (error.message || "").toLowerCase();
      const status = error.status || error.httpStatusCode || error.code || 0;

      // Classify whether this error is worth retrying
      const isQuota =
        msg.includes("429") || msg.includes("rate limit") ||
        msg.includes("quota") || msg.includes("resource_exhausted") ||
        status === 429;

      const isOverloaded =
        msg.includes("503") || msg.includes("service unavailable") ||
        msg.includes("overloaded") || status === 503 || status === 502;

      const isNetwork =
        msg.includes("etimedout") || msg.includes("econnreset") ||
        msg.includes("econnrefused") || msg.includes("socket hang up") ||
        msg.includes("network");

      const isRetryable = isQuota || isOverloaded || isNetwork;

      if (isRetryable && i < retries - 1) {
        const baseDelay = Math.pow(2, i + 1) * 1000; // 2s, 4s, 8s
        const jitter    = Math.floor(Math.random() * 500);
        const delay     = baseDelay + jitter;

        console.warn(
          `⚠️  Gemini attempt ${i + 1}/${retries} failed — ` +
          `[${isQuota ? "QUOTA" : isOverloaded ? "OVERLOADED" : "NETWORK"}] ` +
          `${error.message?.slice(0, 80)} — retrying in ${Math.round(delay / 1000)}s`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      break;
    }
  }

  // Re-throw the real last error — NOT a generic wrapper.
  // The controller reads error.message to classify and show to the recruiter.
  throw lastError || new Error("Gemini failed after all retries");
}

// ─────────────────────────────────────────────────────────────────────────────
// screenCandidates — batched AI screening
// ─────────────────────────────────────────────────────────────────────────────
export async function screenCandidates(
  job: JobInput,
  applicants: ApplicantInput[],
  topN?: number | "all"
): Promise<ScreeningOutput> {
  if (!applicants?.length) {
    throw new Error("No applicants provided for screening");
  }

  console.log(`🤖 Screening ${applicants.length} candidates for: ${job.title}`);

  const BATCH_SIZE = 20;
  const batches: ApplicantInput[][] = [];
  for (let i = 0; i < applicants.length; i += BATCH_SIZE) {
    batches.push(applicants.slice(i, i + BATCH_SIZE));
  }
  console.log(`📦 ${batches.length} batch(es) × max ${BATCH_SIZE} candidates`);

  let allResults: CandidateResult[] = [];
  // Keep track of the last real error so we can re-throw it if all batches fail
  let lastBatchError: any = null;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 Batch ${i + 1}/${batches.length} — ${batch.length} candidates`);

    try {
      const prompt      = buildScreeningPrompt(job, batch);
      const rawResponse = await callGeminiWithRetry(prompt, 4);

      let parsed: CandidateResult[];
      try {
        parsed = parseScreeningResponse(rawResponse);
      } catch (parseErr: any) {
        console.error(`❌ Batch ${i + 1} parse error:`, parseErr);
        console.error(`📄 Raw Gemini response (first 500 chars):\n`, rawResponse?.slice(0, 500));
        // Parse errors are not retryable — re-throw immediately so the recruiter
        // gets a useful message rather than a generic "all batches failed"
        throw new Error(
          `AI returned an unexpected response format for batch ${i + 1}. Please try again.`
        );
      }

      const batchIds = batch.map((a) => a.id);
      const { valid, errors } = validateResults(parsed, batchIds);
      if (!valid) console.warn(`⚠️ Batch ${i + 1} validation warnings:`, errors);

      allResults = [...allResults, ...parsed];
      console.log(`✅ Batch ${i + 1} complete — ${parsed.length} candidates scored`);

      // 1s gap between batches — rate limit protection
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error: any) {
      lastBatchError = error;
      console.error(`❌ Batch ${i + 1} failed:`, error.message || error);

      // If this is a quota/auth error, stop immediately — retrying other batches
      // will fail the same way and waste time
      const msg = (error.message || "").toLowerCase();
      const isFatal =
        msg.includes("429") || msg.includes("quota") ||
        msg.includes("resource_exhausted") || msg.includes("rate limit") ||
        msg.includes("401") || msg.includes("api key") ||
        msg.includes("permission denied") || msg.includes("authentication");

      if (isFatal) {
        console.error(`🛑 Fatal Gemini error — stopping all batches: ${error.message}`);
        // Re-throw immediately with the real error message
        throw error;
      }

      // Non-fatal (parse error, single batch network blip) — continue to next batch
      console.warn(`⚠️ Batch ${i + 1} skipped — continuing with remaining batches`);
    }
  }

  // If no batches succeeded at all, throw the real last error
  if (allResults.length === 0) {
    if (lastBatchError) {
      // Re-throw the actual Gemini error — not a wrapper
      throw lastBatchError;
    }
    throw new Error(
      "AI screening returned no results. The AI may be temporarily unavailable. Please try again."
    );
  }

  // Sort, apply topN, rank
  const normalized = normalizeScores(allResults);
  const sorted     = normalized.sort((a, b) => b.score - a.score);

  let topCandidates: CandidateResult[];
  if (!topN || topN === "all") {
    topCandidates = sorted;
  } else {
    topCandidates = sorted.slice(0, Number(topN));
  }

  topCandidates = topCandidates.map((c, index) => ({ ...c, rank: index + 1 }));

  console.log(
    `✅ Screening complete — ${topCandidates.length} returned from ${applicants.length} total`
  );

  return {
    jobId:            job.id,
    totalApplicants:  applicants.length,
    shortlistedCount: topCandidates.filter((c) => (c.score ?? 0) >= 60).length,
    rankedCandidates: topCandidates,
    screenedAt:       new Date(),
    biasNotice:       BIAS_NOTICE,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// compareCandidates — head-to-head comparison
// ─────────────────────────────────────────────────────────────────────────────
export async function compareCandidates(
  job: JobInput,
  candidates: ApplicantInput[]
): Promise<any> {
  if (candidates.length < 2) throw new Error("Need at least 2 candidates to compare");
  if (candidates.length > 3) throw new Error("Maximum 3 candidates per comparison");

  const prompt = buildComparisonPrompt(job, candidates);
  const text   = await callGeminiWithRetry(prompt, 3);

  let parsed: any;
  try {
    parsed = parseComparisonResponse(text);
  } catch (parseErr) {
    console.error("❌ Comparison parse error:", parseErr);
    console.error("📄 Raw Gemini response:\n", text?.slice(0, 500));
    throw new Error("AI returned an unexpected response for comparison. Please try again.");
  }

  return { ...parsed, biasNotice: BIAS_NOTICE, comparedAt: new Date() };
}

// ─────────────────────────────────────────────────────────────────────────────
// chatWithRecruiter — AI assistant chat
// ─────────────────────────────────────────────────────────────────────────────
export async function chatWithRecruiter(
  message: string,
  context: any
): Promise<string> {
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

  return callGeminiWithRetry(prompt, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// testGeminiConnection — health check
// ─────────────────────────────────────────────────────────────────────────────
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