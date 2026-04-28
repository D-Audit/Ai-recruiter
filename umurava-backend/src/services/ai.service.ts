// umurava-backend/src/services/ai.service.ts
// Fixed:
//   - screenCandidates now accepts topN param (was hardcoded to 10)
//   - retry logic handles 429/quota/rate-limit errors with proper messages
//   - exponential backoff: 2s, 4s, 8s ± jitter

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
// Call Gemini with exponential backoff retry.
// Handles: 503 overloaded · 429 rate limited · ETIMEDOUT · ECONNRESET
// ─────────────────────────────────────────────────────────────────────────────
export async function callGeminiWithRetry(prompt: string, retries = 3): Promise<string> {
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
      const status = error.status || error.code || 0;

      const isRetryable =
        msg.includes("503")              || msg.includes("service unavailable") || msg.includes("overloaded") ||
        msg.includes("429")              || msg.includes("rate limit")          || msg.includes("quota")       ||
        msg.includes("resource_exhausted") ||
        msg.includes("etimedout")        || msg.includes("econnreset")         || msg.includes("econnrefused") ||
        msg.includes("socket hang up")   || msg.includes("network")            ||
        status === 503                   || status === 429                      || status === 502;

      if (isRetryable && i < retries - 1) {
        // Exponential backoff with jitter: 2s, 4s, 8s (± 500ms jitter)
        const baseDelay = Math.pow(2, i + 1) * 1000;
        const jitter    = Math.floor(Math.random() * 500);
        const delay     = baseDelay + jitter;

        console.log(
          `⚠️  Gemini error (${error.message?.slice(0, 80)}) — retrying in ${Math.round(delay / 1000)}s (attempt ${i + 1}/${retries})`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // Not retryable or out of retries
      break;
    }
  }

  throw lastError || new Error("Gemini failed after all retries");
}

const BATCH_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Screen candidates (batched)
// topN: how many to return — "all" returns every scored candidate
// ─────────────────────────────────────────────────────────────────────────────
export async function screenCandidates(
  job: JobInput,
  applicants: ApplicantInput[],
  topN: number | "all" = 10  // ✅ was hardcoded to .slice(0,10) — now configurable
): Promise<ScreeningOutput> {
  if (!applicants?.length) throw new Error("No applicants provided for screening");

  console.log(`🤖 Screening ${applicants.length} candidates for: ${job.title} (topN=${topN})`);

  // Split into batches of 20
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
      const rawResponse = await callGeminiWithRetry(prompt, 4); // 4 retries for screening

      let parsed: CandidateResult[];
      try {
        parsed = parseScreeningResponse(rawResponse);
      } catch (parseErr) {
        console.error(`❌ Batch ${i + 1} parse error:`, parseErr);
        console.error(`📄 Raw Gemini response (batch ${i + 1}):\n`, rawResponse?.slice(0, 500));
        throw parseErr;
      }

      const batchIds = batch.map((a) => a.id);
      const { valid, errors } = validateResults(parsed, batchIds);
      if (!valid) console.warn(`⚠️ Batch ${i + 1} validation warnings:`, errors);

      allResults = [...allResults, ...parsed];
      console.log(`✅ Batch ${i + 1} complete — ${parsed.length} candidates scored`);

      // 1 second gap between batches to respect rate limits
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      // Continue processing other batches — don't fail the whole screening
    }
  }

  if (allResults.length === 0) {
    throw new Error("AI screening failed — all batches returned errors");
  }

  const normalized = normalizeScores(allResults);
  const sorted     = normalized.sort((a, b) => b.score - a.score);

  // ✅ Respect topN — "all" returns everything, number slices to that count
  const topCandidates = (
    topN === "all" ? sorted : sorted.slice(0, topN)
  ).map((c, index) => ({ ...c, rank: index + 1 }));

  console.log(
    `✅ Screening complete — ${topCandidates.length} returned from ${applicants.length} total (topN=${topN})`
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

// ─────────────────────────────────────────────────────────────────────────────
// Compare 2–3 candidates head-to-head
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
    throw parseErr;
  }

  return { ...parsed, biasNotice: BIAS_NOTICE, comparedAt: new Date() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recruiter AI chat
// ─────────────────────────────────────────────────────────────────────────────
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

  return callGeminiWithRetry(prompt, 2);
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Gemini connection
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