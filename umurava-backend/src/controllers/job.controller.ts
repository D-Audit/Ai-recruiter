// umurava-backend/src/controllers/job.controller.ts

import { Response } from "express";
import Job from "../models/Job.model";
import Applicant from "../models/Applicant.model";
import ScreeningResult from "../models/ScreeningResult.model";

export const createJob = async (req: any, res: Response): Promise<void> => {
  try {
    const job = await Job.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create job", error });
  }
};

export const getAllJobs = async (req: any, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get jobs" });
  }
};

export const getJob = async (req: any, res: Response): Promise<void> => {
  try {
    const job = await Job.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get job" });
  }
};

export const updateJob = async (req: any, res: Response): Promise<void> => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true }
    );
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update job" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/jobs/:id
// Deletes the job and cleans up:
//   - Screening results for this job
//   - Applicants whose only job was this one (unlinks others)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteJob = async (req: any, res: Response): Promise<void> => {
  try {
    const jobId = req.params.id;

    const job = await Job.findOneAndDelete({ _id: jobId, createdBy: req.user.id });
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }

    // 1. Remove this jobId from every applicant linked to it
    await Applicant.updateMany(
      { jobIds: jobId },
      { $pull: { jobIds: jobId } }
    );

    // 2. Delete applicants who now have no remaining jobs
    await Applicant.deleteMany({ jobIds: { $size: 0 } });

    // 3. Remove all screening results for this job
    await ScreeningResult.deleteMany({ jobId });

    console.log(`✅ Job ${jobId} deleted along with related applicants and screening results`);

    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error: any) {
    console.error("❌ Delete job error:", error);
    res.status(500).json({ success: false, message: "Failed to delete job: " + error.message });
  }
};