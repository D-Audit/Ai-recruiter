
import { Response } from "express";
import Job from "../models/Job.model";
import Applicant from "../models/Applicant.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { screenCandidates, compareCandidates } from "../services/ai.service";
import {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
} from "../services/cache.service";

const WEIGHTS = { skills: 0.4, experience: 0.25, education: 0.2, other: 0.15 };

function extractErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred";

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const msg = error.message || "";

    if (msg.includes("503") || msg.toLowerCase().includes("service unavailable") || msg.toLowerCase().includes("overloaded")) {
      return "AI service is temporarily overloaded. Please wait a moment and try again.";
    }
    if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
      return "AI rate limit reached. Please wait a minute before running screening again.";
    }
    if (msg.toLowerCase().includes("etimedout") || msg.toLowerCase().includes("econnreset") || msg.toLowerCase().includes("network")) {
      return "Network connection to AI service failed. Please check your connection and retry.";
    }
    if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("authentication") || msg.toLowerCase().includes("permission denied")) {
      return "AI service authentication failed. Please contact support.";
    }
    if (msg.toLowerCase().includes("parse") || msg.toLowerCase().includes("json") || msg.toLowerCase().includes("invalid response")) {
      return "AI returned an unexpected response format. Please try again.";
    }
    if (msg.toLowerCase().includes("no applicants")) {
      return "No applicants found for this job. Please add candidates before screening.";
    }
    if (msg.toLowerCase().includes("all batches returned errors")) {
      return "AI screening failed for all candidate batches. This may be a temporary AI service issue — please try again in a few minutes.";
    }
    if (msg.toLowerCase().includes("empty response")) {
      return "AI returned an empty response. Please try again.";
    }
    
    if (msg.length > 5 && msg.length < 300) return msg;
  }


  if (typeof error === "object" && "message" in (error as object)) {
    return String((error as any).message);
  }

  return "An unexpected error occurred during screening";
}


export const runScreening = async (req: any, res: Response): Promise<void> => {
  const { jobId } = req.params;

  try {
    // 1. Fetch job
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        message: "Job not found",
        errorCode: "JOB_NOT_FOUND",
      });
      return;
    }

    // 2. Fetch applicants for this job
    const applicants = await Applicant.find({ jobIds: jobId });
    if (!applicants.length) {
      res.status(400).json({
        success: false,
        message: "No applicants found for this job. Add candidates before running screening.",
        errorCode: "NO_APPLICANTS",
      });
      return;
    }

    // 3. Check semantic cache
    const applicantIds = applicants.map((a) => String(a._id));
    const cacheKey     = generateCacheKey(jobId, applicantIds, WEIGHTS);
    const cached       = await getCachedResult(cacheKey);

    if (cached) {
      console.log(`✅ Cache hit — returning stored result for job ${jobId}`);
      res.json({
        success: true,
        data: { ...cached, fromCache: true },
      });
      return;
    }

    // 4. Map to AI input format
    const jobInput = {
      id:                String(job._id),
      title:             job.title,
      description:       job.description,
      requiredSkills:    job.requiredSkills,
      yearsOfExperience: job.yearsOfExperience,
      educationLevel:    job.educationLevel,
      location:          job.location,
    };

    const applicantInputs = applicants.map((a: any) => ({
      id:            String(a._id),
      firstName:     a.firstName,
      lastName:      a.lastName,
      email:         a.email,
      headline:      a.headline || "",
      location:      a.location || "",
      skills:        a.skills || [],
      languages:     a.languages || [],
      experience:    a.experience || [],
      education:     a.education || [],
      certifications: a.certifications || [],
      projects:      a.projects || [],
      availability:  a.availability || { status: "Available", type: "Full-time" },
      source:        a.source || "external",
    }));

    // 5. Run AI screening
    let result;
    try {
      result = await screenCandidates(jobInput, applicantInputs);
    } catch (aiError: unknown) {
      const friendlyMessage = extractErrorMessage(aiError);
      console.error("❌ AI screening error:", aiError);
      res.status(500).json({
        success: false,
        message: friendlyMessage,
        errorCode: "AI_SCREENING_FAILED",
        // Include technical detail for debugging (won't show to end users)
        detail: aiError instanceof Error ? aiError.message : String(aiError),
      });
      return;
    }

    // 6. Save AI scores back to applicant records
    for (const ranked of result.rankedCandidates) {
      await Applicant.findByIdAndUpdate(ranked.candidateId, {
        aiScore:         ranked.score,
        confidenceLevel: ranked.confidence,
      });
    }

    // 7. Update job status to "screening"
    await Job.findByIdAndUpdate(jobId, { status: "screening" });

    // 8. Upsert screening result
    const screeningDoc = await ScreeningResult.findOneAndUpdate(
      { jobId },
      {
        jobId,
        totalApplicants:  result.totalApplicants,
        shortlistedCount: result.shortlistedCount,
        rankedCandidates: result.rankedCandidates,
        biasNotice:       result.biasNotice,
        screenedAt:       result.screenedAt,
      },
      { upsert: true, new: true }
    );

    // 9. Cache the result
    await setCachedResult(cacheKey, jobId, {
      ...result,
      _id: String(screeningDoc._id),
    });

    res.json({
      success: true,
      data: { ...result, _id: String(screeningDoc._id), fromCache: false },
    });
  } catch (error: unknown) {
    const friendlyMessage = extractErrorMessage(error);
    console.error("❌ Screening controller error:", error);
    res.status(500).json({
      success: false,
      message: friendlyMessage,
      errorCode: "SCREENING_ERROR",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/screening/results/:jobId
// ─────────────────────────────────────────────────────────────────────────────
export const getScreeningResults = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const result = await ScreeningResult.findOne({ jobId })
      .populate("rankedCandidates.candidateId")
      .lean();

    if (!result) {
      res.status(404).json({
        success: false,
        message: "No screening results found for this job. Run screening first.",
        errorCode: "NO_RESULTS",
      });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error: unknown) {
    const friendlyMessage = extractErrorMessage(error);
    console.error("❌ Get results error:", error);
    res.status(500).json({
      success: false,
      message: friendlyMessage,
      errorCode: "FETCH_ERROR",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/screening/compare
// ─────────────────────────────────────────────────────────────────────────────
export const compareApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, candidateIds } = req.body;

    if (!jobId || !candidateIds?.length) {
      res.status(400).json({
        success: false,
        message: "jobId and candidateIds are required",
        errorCode: "MISSING_PARAMS",
      });
      return;
    }
    if (candidateIds.length < 2) {
      res.status(400).json({
        success: false,
        message: "Please select at least 2 candidates to compare.",
        errorCode: "TOO_FEW_CANDIDATES",
      });
      return;
    }
    if (candidateIds.length > 3) {
      res.status(400).json({
        success: false,
        message: "You can compare a maximum of 3 candidates at a time.",
        errorCode: "TOO_MANY_CANDIDATES",
      });
      return;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found", errorCode: "JOB_NOT_FOUND" });
      return;
    }

    const candidates = await Applicant.find({ _id: { $in: candidateIds } });
    if (candidates.length < 2) {
      res.status(404).json({
        success: false,
        message: "Could not find the selected candidates. They may have been removed.",
        errorCode: "CANDIDATES_NOT_FOUND",
      });
      return;
    }

    const jobInput = {
      id:                String(job._id),
      title:             job.title,
      description:       job.description,
      requiredSkills:    job.requiredSkills,
      yearsOfExperience: job.yearsOfExperience,
      educationLevel:    job.educationLevel,
      location:          job.location,
    };

    const candidateInputs = candidates.map((c: any) => ({
      id:            String(c._id),
      firstName:     c.firstName,
      lastName:      c.lastName,
      email:         c.email,
      headline:      c.headline || "",
      location:      c.location || "",
      skills:        c.skills || [],
      languages:     c.languages || [],
      experience:    c.experience || [],
      education:     c.education || [],
      certifications: c.certifications || [],
      projects:      c.projects || [],
      availability:  c.availability || { status: "Available", type: "Full-time" },
      source:        c.source || "external",
    }));

    let comparison;
    try {
      comparison = await compareCandidates(jobInput, candidateInputs);
    } catch (aiError: unknown) {
      const friendlyMessage = extractErrorMessage(aiError);
      console.error("❌ AI comparison error:", aiError);
      res.status(500).json({
        success: false,
        message: friendlyMessage,
        errorCode: "AI_COMPARISON_FAILED",
      });
      return;
    }

    res.json({ success: true, data: comparison });
  } catch (error: unknown) {
    const friendlyMessage = extractErrorMessage(error);
    console.error("❌ Compare controller error:", error);
    res.status(500).json({
      success: false,
      message: friendlyMessage,
      errorCode: "COMPARISON_ERROR",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/screening/all  (list all jobs that have been screened)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllScreenings = async (req: any, res: Response): Promise<void> => {
  try {
    const screenings = await ScreeningResult.find()
      .sort({ screenedAt: -1 })
      .lean();

    const jobIds = [...new Set(screenings.map((s) => s.jobId))];
    const jobs   = await Job.find({ _id: { $in: jobIds } }).lean();
    const jobMap = new Map(jobs.map((j) => [String(j._id), j]));

    const enriched = screenings.map((s) => ({
      ...s,
      job: jobMap.get(String(s.jobId)) || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (error: unknown) {
    const friendlyMessage = extractErrorMessage(error);
    console.error("❌ Get all screenings error:", error);
    res.status(500).json({
      success: false,
      message: friendlyMessage,
      errorCode: "FETCH_ALL_ERROR",
    });
  }
};