import { Response } from "express";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import { parseCSVFile } from "../services/csv.service";
import { parsePDFResume } from "../services/pdf.service";

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    // jobIds is an array field — Mongo matches docs where the array contains this value
    const applicants = await Applicant.find({ jobIds: req.params.jobId });
    res.json({ success: true, count: applicants.length, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get applicants" });
  }
};

export const getUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const profiles = await Applicant.find({ source: "umurava" }).limit(100);
    res.json({ success: true, count: profiles.length, profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profiles" });
  }
};

export const uploadCSV = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const { jobId } = req.body;
    const parsed = await parseCSVFile(req.file.path);

    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted = await Applicant.insertMany(applicants);

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: inserted.length } });

    res.json({
      success: true,
      message: `${inserted.length} applicants uploaded successfully`,
      count: inserted.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "CSV upload failed", error });
  }
};

export const uploadPDF = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const { jobId } = req.body;
    const parsed = await parsePDFResume(req.file.path);

    const applicant = await Applicant.create({ ...parsed, jobIds: [jobId] });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.json({ success: true, message: "PDF parsed successfully", applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: "PDF upload failed", error });
  }
};

export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;

    // ── Step 1: find which of the selected profiles already have this jobId ──
    // $addToSet on updateMany would still update the count incorrectly,
    // so we split into "already linked" vs "newly linked" first.
    const alreadyLinked = await Applicant.find({
      _id: { $in: profileIds },
      jobIds: jobId,           // jobIds array already contains this jobId
    }).select("_id");

    const alreadyLinkedIds = new Set(alreadyLinked.map((p) => String(p._id)));

    const newProfileIds = profileIds.filter(
      (id: string) => !alreadyLinkedIds.has(String(id))
    );

    if (newProfileIds.length === 0) {
      res.json({
        success: true,
        count: 0,
        message: "All selected profiles are already linked to this job",
      });
      return;
    }

    // ── Step 2: atomically append jobId to each new profile's jobIds array ──
    // $addToSet guarantees no duplicates even under concurrent requests
    await Applicant.updateMany(
      { _id: { $in: newProfileIds } },
      { $addToSet: { jobIds: jobId } }
    );

    // ── Step 3: increment job applicant count only for genuinely new links ──
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicantsCount: newProfileIds.length },
    });

    res.json({
      success: true,
      count: newProfileIds.length,
      skipped: alreadyLinkedIds.size,
      message: `${newProfileIds.length} profile${newProfileIds.length !== 1 ? "s" : ""} added${
        alreadyLinkedIds.size > 0
          ? `, ${alreadyLinkedIds.size} already linked (skipped)`
          : ""
      }`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};