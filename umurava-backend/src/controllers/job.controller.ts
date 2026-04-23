// umurava-backend/src/controllers/job.controller.ts

import { Response } from "express";
import Job from "../models/Job.model";

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
    // Only return jobs created by the logged-in recruiter
    const jobs = await Job.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get jobs" });
  }
};

export const getJob = async (req: any, res: Response): Promise<void> => {
  try {
    // Only allow access if the job belongs to the logged-in recruiter
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
    // Only allow update if the job belongs to the logged-in recruiter
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

export const deleteJob = async (req: any, res: Response): Promise<void> => {
  try {
    // Only allow delete if the job belongs to the logged-in recruiter
    const job = await Job.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!job) {
      res.status(404).json({ success: false, message: "Job not found" });
      return;
    }
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete job" });
  }
};