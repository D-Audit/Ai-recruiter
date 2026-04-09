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

    const profiles = await Applicant.find({ _id: { $in: profileIds } });

    let addedCount = 0;

    for (const p of profiles) {
      // Check if already added to this job
      const exists = await Applicant.findOne({
        email: p.email,
        jobId: jobId,
      });

      if (!exists) {
        await Applicant.create({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          headline: p.headline,
          bio: p.bio,
          skills: p.skills,
          languages: p.languages,
          experience: p.experience,
          education: p.education,
          certifications: p.certifications,
          projects: p.projects,
          availability: p.availability,
          socialLinks: p.socialLinks,
          location: p.location,
          source: "umurava",
          jobId,
        });
        addedCount++;
      }
    }

    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicantsCount: addedCount },
    });

    res.json({
      success: true,
      count: addedCount,
      message: addedCount === 0
        ? "All selected profiles already added to this job"
        : `${addedCount} profiles added successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};