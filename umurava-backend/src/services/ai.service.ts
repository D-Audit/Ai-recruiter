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

const BIAS_NOTICE = `⚠️ AI Bias Notice: This screening may favor candidates 
with formal education degrees over self-taught developers. 
Skills and project experience should be weighted equally to 
formal credentials. Final decisions must be made by human recruiters.`;


async function callGeminiWithRetry(
  prompt: string,
  retries = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      const is503 = error.message?.includes("503") ||
        error.message?.includes("Service Unavailable") ||
        error.message?.includes("overloaded");

      if (is503 && i < retries - 1) {
        console.log(`⚠️ Gemini busy, retrying in ${(i + 1) * 2}s... (attempt ${i + 1}/${retries})`);
        await new Promise((resolve) =>
          setTimeout(resolve, (i + 1) * 2000)
        );
        continue;
      }
      throw error;
    }
  }
  throw new Error("Gemini failed after all retries");
}

const BATCH_SIZE = 20;

// ─────────────────────────────────────────────
// MAIN FUNCTION — Screen candidates with batching
// ─────────────────────────────────────────────
export async function screenCandidates(
  job: JobInput,
  applicants: ApplicantInput[]
): Promise<ScreeningOutput> {
  console.log(
    `🤖 Screening ${applicants.length} candidates for: ${job.title}`
  );

  if (!applicants || applicants.length === 0) {
    throw new Error("No applicants provided for screening");
  }

  let allResults: CandidateResult[] = [];

  // Split into batches of 20
  const batches: ApplicantInput[][] = [];
  for (let i = 0; i < applicants.length; i += BATCH_SIZE) {
    batches.push(applicants.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `📦 Processing ${batches.length} batch(es) of max ${BATCH_SIZE} candidates`
  );

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `🔄 Batch ${i + 1}/${batches.length} — ${batch.length} candidates`
    );

    try {
      const prompt = buildScreeningPrompt(job, batch);
      const rawResponse = await callGeminiWithRetry(prompt);
      const parsed = parseScreeningResponse(rawResponse);

      // Validate batch results
      const batchIds = batch.map((a) => a.id);
      const { valid, errors } = validateResults(parsed, batchIds);
      if (!valid) console.warn(`⚠️ Batch ${i + 1} warnings:`, errors);

      allResults = [...allResults, ...parsed];
      console.log(
        `✅ Batch ${i + 1} complete — ${parsed.length} candidates scored`
      );

      // Small delay between batches to avoid rate limits
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      // Continue with next batch even if one fails
    }
  }

  if (allResults.length === 0) {
    throw new Error("AI screening failed for all batches");
  }

  // Normalize all scores
  const normalized = normalizeScores(allResults);

  // Sort by score highest to lowest
  const sorted = normalized.sort((a, b) => b.score - a.score);

  // Take top 10 OR all if less than 10
  const topCandidates = sorted
    .slice(0, 10)
    .map((c, index) => ({ ...c, rank: index + 1 }));

  console.log(
    `✅ Screening complete — ${topCandidates.length} candidates shortlisted from ${applicants.length} total`
  );

  return {
    jobId: job.id,
    totalApplicants: applicants.length,
    shortlistedCount: topCandidates.length,
    rankedCandidates: topCandidates,
    screenedAt: new Date(),
    biasNotice: BIAS_NOTICE,
  };
}

// ─────────────────────────────────────────────
// Compare 2 or 3 candidates
// ─────────────────────────────────────────────
export async function compareCandidates(
  job: JobInput,
  candidates: ApplicantInput[]
): Promise<any> {
  if (candidates.length < 2) {
    throw new Error("Need at least 2 candidates");
  }
  if (candidates.length > 3) {
    throw new Error("Maximum 3 candidates");
  }

  const prompt = buildComparisonPrompt(job, candidates);
  const text = await callGeminiWithRetry(prompt);
const parsed = parseComparisonResponse(text);
  return {
    ...parsed,
    biasNotice: BIAS_NOTICE,
    comparedAt: new Date(),
  };
}

// ─────────────────────────────────────────────
// AI Chat — answer recruiter questions
// ─────────────────────────────────────────────
export async function chatWithRecruiter(
  message: string,
  context: any
): Promise<string> {
  const prompt = `
You are an expert AI recruitment assistant helping a recruiter 
make better hiring decisions.

CURRENT SCREENING CONTEXT:
${JSON.stringify(context, null, 2)}

RECRUITER QUESTION:
${message}

Answer clearly, concisely and professionally.
Focus on helping the recruiter make the best hiring decision.
Keep answer under 150 words.
Do not include any JSON in your response.
Just answer in plain conversational English.
`;

return await callGeminiWithRetry(prompt);
}

// ─────────────────────────────────────────────
// Test Gemini connection
// ─────────────────────────────────────────────
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