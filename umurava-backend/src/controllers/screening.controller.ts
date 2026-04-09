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

    // Format job for AI
    const jobInput = {
      id: job.id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills,
      yearsOfExperience: job.yearsOfExperience,
      educationLevel: job.educationLevel,
      location: job.location,
    };

    // Format applicants for AI
    const applicantInputs = applicants.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      skills: a.skills,
      yearsOfExperience: a.yearsOfExperience,
      education: a.education,
      location: a.location,
      languages: a.languages,
      pastProjects: a.pastProjects,
      source: a.source as "umurava" | "external",
    }));

    // Run AI screening
    const screeningOutput = await screenCandidates(jobInput, applicantInputs);

    // Map candidateId strings back to ObjectIds
    const rankedWithIds = screeningOutput.rankedCandidates.map((r) => ({
      ...r,
      candidateId: r.candidateId,
    }));

    // Save results
    const saved = await ScreeningResult.create({
      jobId,
      totalApplicants: screeningOutput.totalApplicants,
      shortlistedCount: screeningOutput.shortlistedCount,
      rankedCandidates: rankedWithIds,
      biasNotice: screeningOutput.biasNotice,
      screenedAt: screeningOutput.screenedAt,
    });

    // Update job status
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

    const candidateInputs = candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      skills: c.skills,
      yearsOfExperience: c.yearsOfExperience,
      education: c.education,
      location: c.location,
      languages: c.languages,
      pastProjects: c.pastProjects,
      source: c.source as "umurava" | "external",
    }));

    const comparison = await compareCandidates(jobInput, candidateInputs);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: "Comparison failed", error: String(error) });
  }
};