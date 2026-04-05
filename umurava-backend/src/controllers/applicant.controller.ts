import { Response } from "express";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import { parseCSVFile } from "../services/csv.service";
import { parsePDFResume } from "../services/pdf.service";

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find({ jobId: req.params.jobId });
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

    const applicants = parsed.map((p) => ({ ...p, jobId }));
    const inserted = await Applicant.insertMany(applicants);


    // Update job applicants count
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
    const applicant = await Applicant.create({ ...parsed, jobId });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.json({ success: true, message: "PDF parsed successfully", applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: "PDF upload failed", error });
  }
};

export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;

    const profiles = await Applicant.find({ _id: { $in: profileIds } });

    const newApplicants = profiles.map((p) => ({
      fullName: p.fullName,
      email: p.email,
      skills: p.skills,
      yearsOfExperience: p.yearsOfExperience,
      education: p.education,
      location: p.location,
      languages: p.languages,
      pastProjects: p.pastProjects,
      source: "umurava",
      jobId,
    }));

    const inserted = await Applicant.insertMany(newApplicants);
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicantsCount: inserted.length },
    });

    res.json({ success: true, count: inserted.length, message: "Profiles selected" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Selection failed", error });
  }
};