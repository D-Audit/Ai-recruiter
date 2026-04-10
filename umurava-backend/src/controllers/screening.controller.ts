import { Response } from "express";
import Job from "../models/Job.model";
import Applicant from "../models/Applicant.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { screenCandidates, compareCandidates } from "../services/ai.service";

export const runScreening = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    const applicants = await Applicant.find({ jobId });
    if (applicants.length === 0) {
      res.status(400).json({ success: false, message: "No applicants found for this job" });
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

    const screeningOutput = await screenCandidates(jobInput, applicantInputs);

    // Save AI-generated scores back to applicant records (extensibility)
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

    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: "Screening failed", error: String(error) });
  }
};

export const getResults = async (req: any, res: Response): Promise<void> => {
  try {
    const result = await ScreeningResult.findOne({ jobId: req.params.jobId })
      .populate("rankedCandidates.candidateId")
      .sort({ screenedAt: -1 });

    if (!result) {
      res.status(404).json({ success: false, message: "No screening results found" });
      return;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get results" });
  }
};

export const compareSelectedCandidates = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, candidateIds } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    const candidates = await Applicant.find({ _id: { $in: candidateIds } });

    const jobInput = {
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      yearsOfExperience: job.yearsOfExperience,
      educationLevel: job.educationLevel,
      location: job.location,
    };

    const candidateInputs = candidates.map((c: any) => ({
      id: c.id,
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      headline: c.headline || "",
      bio: c.bio || "",
      location: c.location || "",
      skills: c.skills || [],
      languages: c.languages || [],
      experience: c.experience || [],
      education: c.education || [],
      certifications: c.certifications || [],
      projects: c.projects || [],
      availability: c.availability || { status: "Available", type: "Full-time" },
      socialLinks: c.socialLinks || { linkedin: "", github: "", portfolio: "" },
      source: c.source || "umurava",
    }));

    const comparison = await compareCandidates(jobInput, candidateInputs);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: "Comparison failed", error: String(error) });
  }
};