import { Response } from "express";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import { parseCSVFile } from "../services/csv.service";
import { parsePDFResume } from "../services/pdf.service";

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    // Match any applicant whose jobIds array contains the given jobId
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

    // Store jobId inside jobIds array so future jobs can be appended
    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted = await Applicant.insertMany(applicants);

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicantsCount: inserted.length },
    });

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

    // Store jobId inside jobIds array
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
    console.log("Selecting profiles", { jobId, profileIds });

    // $addToSet appends the new jobId without overwriting existing ones
    // and prevents duplicates if the same profile is selected twice
    await Applicant.updateMany(
      { _id: { $in: profileIds } },
      { $addToSet: { jobIds: jobId } }
    );

    await Job.updateOne({ _id: jobId }, { $inc: { applicantsCount: profileIds.length } });

    res.json({ success: true, count: profileIds.length, message: "Profiles selected" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Selection failed", error });
  }
};