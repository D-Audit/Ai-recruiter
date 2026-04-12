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

// ─────────────────────────────────────────────
// Helper: map an applicant document → AI input
// ─────────────────────────────────────────────
const toApplicantInput = (a: any) => ({
  id: a.id,
  firstName:      a.firstName      || "",
  lastName:       a.lastName       || "",
  email:          a.email          || "",
  headline:       a.headline       || "",
  bio:            a.bio            || "",
  location:       a.location       || "",
  skills:         a.skills         || [],
  languages:      a.languages      || [],
  experience:     a.experience     || [],
  education:      a.education      || [],
  certifications: a.certifications || [],
  projects:       a.projects       || [],
  availability:   a.availability   || { status: "Available", type: "Full-time" },
  socialLinks:    a.socialLinks    || { linkedin: "", github: "", portfolio: "" },
  source:         a.source         || "umurava",
});

// ─────────────────────────────────────────────
// Helper: map a job document → AI input
// ─────────────────────────────────────────────
const toJobInput = (job: any) => ({
  id:                job.id,
  title:             job.title,
  description:       job.description,
  requiredSkills:    job.requiredSkills,
  yearsOfExperience: job.yearsOfExperience,
  educationLevel:    job.educationLevel,
  location:          job.location,
});

// ─────────────────────────────────────────────
// POST /screening/:jobId/run
// ─────────────────────────────────────────────
export const runScreening = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    // ── Updated: query by jobIds array (was jobId scalar) ──
    const applicants = await Applicant.find({ jobIds: jobId });

    if (applicants.length === 0) {
      res.status(400).json({
        success: false,
        message: "No applicants found for this job. Upload candidates or select Umurava profiles first.",
      });
      return;
    }

    const jobInput = {
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      yearsOfExperience: job.yearsOfExperience,
      educationLevel: job.educationLevel,
      location: job.location,
    };

    const applicantInputs = applicants.map((a: any) => ({
      id: a.id,
      firstName: a.firstName || "",
      lastName: a.lastName || "",
      email: a.email || "",
      headline: a.headline || "",
      bio: a.bio || "",
      location: a.location || "",
      skills: a.skills || [],
      languages: a.languages || [],
      experience: a.experience || [],
      education: a.education || [],
      certifications: a.certifications || [],
      projects: a.projects || [],
      availability: a.availability || { status: "Available", type: "Full-time" },
      socialLinks: a.socialLinks || { linkedin: "", github: "", portfolio: "" },
      source: a.source || "umurava",
    }));

    // 🧠 CACHE LOGIC (ONLY ADDITION)
    const weights = {
      skills: 0.4,
      experience: 0.25,
      education: 0.2,
      location: 0.15,
    };

    const applicantIds = applicants.map((a) => a.id);
    const cacheKey = generateCacheKey(jobId, applicantIds, weights);

    const cached = await getCachedResult(cacheKey);

    if (cached) {
      console.log("🎯 Returning cached screening result");

      res.json({
        success: true,
        data: cached,
        fromCache: true,
      });

      return;
    }

    // AI CALL (UNCHANGED)
    const screeningOutput = await screenCandidates(jobInput, applicantInputs);

    // Save AI-generated scores back to applicant records (UNCHANGED)
    for (const result of screeningOutput.rankedCandidates) {
      await Applicant.findByIdAndUpdate(result.candidateId, {
        aiScore: result.score,
        confidenceLevel: result.confidence,
      });
    }

    const saved = await ScreeningResult.create({
      jobId,
      totalApplicants: screeningOutput.totalApplicants,
      shortlistedCount: screeningOutput.shortlistedCount,
      rankedCandidates: screeningOutput.rankedCandidates.map((r) => ({
        candidateId: r.candidateId,
        rank: r.rank,
        score: r.score,
        strengths: r.strengths,
        gaps: r.gaps,
        recommendation: r.recommendation,
        skillsMatched: r.skillsMatched || [],
        skillsMissing: r.skillsMissing || [],
        confidence: r.confidence || "Medium",
      })),
      biasNotice: screeningOutput.biasNotice,
      screenedAt: screeningOutput.screenedAt,
    });

    await Job.findByIdAndUpdate(jobId, { status: "screening" });

    // 💾 SAVE TO CACHE (NEW ADDITION)
    await setCachedResult(cacheKey, jobId, saved);

    res.json({ success: true, data: saved, fromCache: false });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Screening failed",
      error: String(error),
    });
  }
};

// ------------------- NO CHANGES BELOW -------------------

export const getResults = async (req: any, res: Response): Promise<void> => {
  try {
    // Return the most recent result for this job
    const result = await ScreeningResult.findOne({ jobId: req.params.jobId })
      .populate("rankedCandidates.candidateId")
      .sort({ screenedAt: -1 });

    if (!result) {
      res.status(404).json({ success: false, message: "No screening results found for this job" });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve screening results" });
  }
};

// ─────────────────────────────────────────────
// POST /screening/compare
// ─────────────────────────────────────────────
export const compareSelectedCandidates = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, candidateIds } = req.body;

    if (!candidateIds || candidateIds.length < 2) {
      res.status(400).json({ success: false, message: "Please provide at least 2 candidate IDs to compare" });
      return;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    // ── Only compare candidates that actually belong to this job ──
    const candidates = await Applicant.find({
      _id:    { $in: candidateIds },
      jobIds: jobId,                  // updated: was jobId scalar
    });

    if (candidates.length === 0) {
      res.status(400).json({
        success: false,
        message: "None of the provided candidates are linked to this job",
      });
      return;
    }

    const comparison = await compareCandidates(
      toJobInput(job),
      candidates.map(toApplicantInput)
    );

    res.json({ success: true, data: comparison });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Comparison failed",
      error: String(error),
    });
  }
};