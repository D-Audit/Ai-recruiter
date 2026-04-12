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

const toApplicantInput = (a: any) => ({
  id:             String(a._id),
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

const toJobInput = (job: any) => ({
  id:                job.id,
  title:             job.title,
  description:       job.description,
  requiredSkills:    job.requiredSkills,
  yearsOfExperience: job.yearsOfExperience,
  educationLevel:    job.educationLevel,
  location:          job.location,
});

export const runScreening = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    const applicants = await Applicant.find({ jobIds: jobId });

    if (applicants.length === 0) {
      res.status(400).json({
        success: false,
        message: "No applicants found for this job. Upload candidates or select Umurava profiles first.",
      });
      return;
    }

    const weights = { skills: 0.4, experience: 0.25, education: 0.2, location: 0.15 };
    const applicantIds = applicants.map((a) => a.id);
    const cacheKey = generateCacheKey(jobId, applicantIds, weights);
    const cached = await getCachedResult(cacheKey);

    if (cached) {
      console.log("🎯 Returning cached screening result");
      res.json({ success: true, data: cached, fromCache: true });
      return;
    }

    const screeningOutput = await screenCandidates(
      toJobInput(job),
      applicants.map(toApplicantInput)
    );

    const scoreUpdates = screeningOutput.rankedCandidates.map((r) =>
      Applicant.findByIdAndUpdate(r.candidateId, {
        aiScore:         r.score,
        confidenceLevel: r.confidence,
      })
    );
    await Promise.all(scoreUpdates);

    const saved = await ScreeningResult.findOneAndUpdate(
      { jobId },
      {
        jobId,
        totalApplicants:  screeningOutput.totalApplicants,
        shortlistedCount: screeningOutput.shortlistedCount,
        rankedCandidates: screeningOutput.rankedCandidates.map((r) => ({
          candidateId:    r.candidateId,
          rank:           r.rank,
          score:          r.score,
          strengths:      r.strengths,
          gaps:           r.gaps,
          recommendation: r.recommendation,
          skillsMatched:  r.skillsMatched  || [],
          skillsMissing:  r.skillsMissing  || [],
          confidence:     r.confidence     || "Medium",
          upskillingPaths: r.upskillingPaths || [],
          adjacentRoles:   r.adjacentRoles  || [],
        })),
        biasNotice: screeningOutput.biasNotice,
        screenedAt: screeningOutput.screenedAt,
      },
      { upsert: true, new: true }
    );

    await Job.findByIdAndUpdate(jobId, { status: "screening" });
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

export const getResults = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await ScreeningResult.findOne({ jobId: req.params.jobId })
      .populate("rankedCandidates.candidateId")
      .sort({ screenedAt: -1 });

    if (!result) {
      res.status(404).json({
        success: false,
        message: "No screening results found for this job",
      });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve screening results" });
  }
};

export const getAllScreenings = async (req: any, res: Response): Promise<void> => {
  try {
    const results = await ScreeningResult.find()
      .populate("jobId", "title")
      .sort({ screenedAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve screenings" });
  }
};

export const compareSelectedCandidates = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const { jobId, candidateIds } = req.body;

    if (!candidateIds || candidateIds.length < 2) {
      res.status(400).json({
        success: false,
        message: "Please provide at least 2 candidate IDs to compare",
      });
      return;
    }

    if (candidateIds.length > 3) {
      res.status(400).json({
        success: false,
        message: "You can compare at most 3 candidates at once",
      });
      return;
    }

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    const candidates = await Applicant.find({
      _id:    { $in: candidateIds },
      jobIds: jobId,
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