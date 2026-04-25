// umurava-backend/src/controllers/applicant.controller.ts

import { Response } from "express";
import fs from "fs";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { parseCSVFile } from "../services/csv.service";
import { parseXLSXFile } from "../services/xlsx.service";
import { parseResumeFile, parseResumeUrl } from "../services/resume.service";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanupFile(filePath?: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}

const BLOCKED_DOMAINS = [
  "linkedin.com", "instagram.com", "facebook.com",
  "twitter.com", "x.com", "tiktok.com",
];

async function fetchUrl(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? require("https") : require("http");
    const request = lib.request(
      {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        method:   "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; UmuravaAI/1.0; +https://umurava.ai)",
          "Accept":     "text/html,application/pdf,text/plain,*/*",
        },
        timeout: 15000,
      },
      (response: any) => {
        if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
          return fetchUrl(response.headers.location).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`URL returned HTTP ${response.statusCode}`));
        }
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          resolve({ buffer: Buffer.concat(chunks), contentType: response.headers["content-type"] || "" })
        );
      }
    );
    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Request timed out after 15 seconds"));
    });
    request.end();
  });
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type UrlKind = "csv" | "xlsx" | "xls" | "pdf" | "docx" | "text" | "html";

function detectKind(contentType: string, url: string): UrlKind {
  const ct  = contentType.toLowerCase();
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ct.includes("text/csv") || ext === "csv") return "csv";
  if (ct.includes("application/vnd.ms-excel") || ext === "xls") return "xls";
  if (ct.includes("spreadsheetml") || ct.includes("vnd.openxmlformats") || ext === "xlsx") return "xlsx";
  if (ct.includes("application/pdf") || ext === "pdf") return "pdf";
  if (ct.includes("application/vnd.openxmlformats") && ext === "docx") return "docx";
  if (ct.includes("text/plain") || ext === "txt") return "text";
  return "html";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: link an applicant to a job, handling duplicates gracefully
// ─────────────────────────────────────────────────────────────────────────────
async function linkApplicantToJob(
  profile: any,
  jobId: string
): Promise<{ applicant: any; isNew: boolean }> {
  if (!profile.email || profile.email.trim() === "") {
    const fallbackEmail = `candidate.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@review.pending`;
    profile = { ...profile, email: fallbackEmail, _emailMissing: true };
  }

  const existing = await Applicant.findOne({ email: profile.email.toLowerCase().trim() });

  if (existing) {
    const update: any = { $addToSet: { jobIds: jobId } };
    if (profile.resumeUrl && profile.resumeUrl !== existing.resumeUrl) {
      update.$set = { resumeUrl: profile.resumeUrl };
    }
    const updated = await Applicant.findByIdAndUpdate(existing._id, update, { new: true });
    return { applicant: updated || existing, isNew: false };
  }

  const applicant = await Applicant.create({
    ...profile,
    email: profile.email.toLowerCase().trim(),
    jobIds: [jobId],
  });
  return { applicant, isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applicants/:jobId
// ─────────────────────────────────────────────────────────────────────────────
export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find({ jobIds: req.params.jobId });
    res.json({ success: true, count: applicants.length, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get applicants" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applicants/profile/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getApplicantById = async (req: any, res: Response): Promise<void> => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      res.status(404).json({ success: false, message: "Applicant not found" });
      return;
    }
    res.json({ success: true, applicant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to get applicant" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applicants/umurava
// ─────────────────────────────────────────────────────────────────────────────
export const getUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const profiles = await Applicant.find({ source: "umurava" }).limit(200);
    res.json({ success: true, count: profiles.length, profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get Umurava profiles" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/csv
// ─────────────────────────────────────────────────────────────────────────────
export const uploadCSV = async (req: any, res: Response): Promise<void> => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }

    const parsed = await parseCSVFile(filePath);
    if (parsed.length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid rows found in CSV. Check that it has firstName/lastName/email columns.",
      });
      return;
    }

    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted = await Applicant.insertMany(applicants, { ordered: false }).catch((e) => {
      if (e.code === 11000 || e.writeErrors) return e.insertedDocs || [];
      throw e;
    });

    const count = Array.isArray(inserted) ? inserted.length : 0;
    if (count > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: count } });

    res.json({
      success: true,
      count,
      message: `${count} applicant${count !== 1 ? "s" : ""} uploaded from CSV${
        parsed.length > count ? ` (${parsed.length - count} duplicates skipped)` : ""
      }`,
    });
  } catch (error: any) {
    console.error("❌ CSV upload error:", error);
    res.status(500).json({ success: false, message: "CSV upload failed: " + error.message });
  } finally {
    cleanupFile(filePath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/preview/csv
// ─────────────────────────────────────────────────────────────────────────────
export const previewCSV = async (req: any, res: Response): Promise<void> => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const parsed  = await parseCSVFile(filePath);
    const headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
    res.json({
      success: true,
      totalCandidates: parsed.length,
      columnsDetected: headers.length,
      headers,
      sample: parsed.slice(0, 3),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "CSV preview failed: " + error.message });
  } finally {
    cleanupFile(filePath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/resume  (single file)
//
// FIX (TS2345 line 230): parseResumeFile(filePath, skipCloudinary?)
//   Second param is boolean (skipCloudinary), NOT string (mimetype).
//   Old code: parseResumeFile(file.path, file.mimetype)  ← wrong, was passing string
//   Fixed:    parseResumeFile(file.path)                 ← omit; default is false = upload
// ─────────────────────────────────────────────────────────────────────────────
export const uploadResume = async (req: any, res: Response): Promise<void> => {
  const filePath = req.file?.path;
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }

    // ✅ FIXED: only pass filePath — second param is skipCloudinary (boolean), not mimetype
    const profile = await parseResumeFile(filePath);
    const { applicant, isNew } = await linkApplicantToJob(profile, jobId);

    if (isNew) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    }

    const updatedJob = await Job.findById(jobId).lean();

    res.json({
      success: true,
      count:   isNew ? 1 : 0,
      applicant,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: isNew
        ? "Resume parsed and candidate added successfully."
        : "Candidate already exists — linked to this job.",
    });
  } catch (error: any) {
    console.error("❌ Resume upload error:", error);
    res.status(500).json({ success: false, message: "Resume upload failed: " + error.message });
  }
  // parseResumeFile handles its own disk cleanup internally after Cloudinary upload
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/resumes  (batch)
//
// Same FIX as single-resume: drop the second arg (mimetype) from parseResumeFile
// ─────────────────────────────────────────────────────────────────────────────
export const uploadResumes = async (req: any, res: Response): Promise<void> => {
  const files: Express.Multer.File[] = req.files || [];
  try {
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }
    if (files.length === 0) {
      res.status(400).json({ success: false, message: "No files uploaded" });
      return;
    }

    let newCount = 0;
    const results: any[] = [];

    for (const file of files) {
      try {
        // ✅ FIXED: only pass file.path — parseResumeFile handles cleanup internally
        const profile = await parseResumeFile(file.path);
        const { applicant, isNew } = await linkApplicantToJob(profile, jobId);
        if (isNew) newCount++;
        results.push({
          candidateName: `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || "Unknown",
          email:        applicant.email,
          headline:     applicant.headline || "",
          location:     applicant.location || "",
          skillsCount:  (applicant.skills       || []).length,
          expCount:     (applicant.experience    || []).length,
          projectCount: (applicant.projects      || []).length,
          eduCount:     (applicant.education     || []).length,
          isExisting:   !isNew,
        });
      } catch (e: any) {
        results.push({ candidateName: file.originalname, email: "", error: e.message });
      }
    }

    if (newCount > 0) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: newCount } });
    }

    const updatedJob = await Job.findById(jobId).lean();

    res.json({
      success: true,
      count: newCount,
      results,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
    });
  } catch (error: any) {
    console.error("❌ Batch resume upload error:", error);
    res.status(500).json({ success: false, message: "Batch upload failed: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/import-url
//
// FIX (TS2554 line 285): parseResumeUrl(url, rawText) requires TWO arguments.
//   Old code: parseResumeUrl(url)          ← missing rawText
//   Fixed:    fetch the URL content first, extract rawText, then call
//             parseResumeUrl(url, rawText) ← both args provided
// ─────────────────────────────────────────────────────────────────────────────
export const uploadFromURL = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, url } = req.body;
    if (!jobId || !url) {
      res.status(400).json({ success: false, message: "jobId and url are required" });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        message: "Invalid URL format. Please provide a full URL including https://",
      });
      return;
    }

    const isBlocked = BLOCKED_DOMAINS.some((d) => parsedUrl.hostname.includes(d));
    if (isBlocked) {
      res.status(400).json({
        success: false,
        message:
          "LinkedIn and social media URLs cannot be imported automatically — they block external access. " +
          "Please download the candidate's resume as a PDF and upload it instead.",
      });
      return;
    }

    console.log(`🌐 Fetching URL: ${url}`);
    const { buffer, contentType } = await fetchUrl(url);
    const kind = detectKind(contentType, url);

    // ── Spreadsheet / CSV URLs ───────────────────────────────────────────────
    if (kind === "csv" || kind === "xlsx" || kind === "xls") {
      const XLSX = require("xlsx");
      const workbook =
        kind === "csv"
          ? XLSX.read(buffer.toString("utf-8"), { type: "string" })
          : XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const applicants: any[] = [];
      for (const row of rows) {
        const firstName = (row.firstName || row.first_name || (row.name || "").split(" ")[0] || "").toString().trim();
        const lastName  = (row.lastName  || row.last_name  || (row.name || "").split(" ").slice(1).join(" ") || "").toString().trim();
        const email     = (row.email || row.Email || "").toString().trim();
        if (!(firstName || lastName) || !email) continue;
        applicants.push({
          firstName, lastName, email,
          headline: (row.headline || "").toString(),
          skills: [], languages: [], experience: [], education: [],
          certifications: [], projects: [],
          availability: { status: "Available", type: "Full-time", startDate: "" },
          socialLinks:  { linkedin: "", github: "", portfolio: "" },
          source: "external",
          jobIds: [jobId],
        });
      }

      if (applicants.length === 0) {
        res.status(400).json({ success: false, message: "No valid rows found in the spreadsheet URL." });
        return;
      }

      const inserted = await Applicant.insertMany(applicants, { ordered: false }).catch((e) => {
        if (e.code === 11000 || e.writeErrors) return e.insertedDocs || [];
        throw e;
      });
      const count = Array.isArray(inserted) ? inserted.length : 0;
      if (count > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: count } });

      res.json({ success: true, count, message: `${count} applicants imported from URL` });
      return;
    }

    // ── Resume URLs (PDF / DOCX / TXT / HTML) ────────────────────────────────
    // ✅ FIXED: extract rawText from buffer, then pass BOTH url and rawText
    let rawText = "";
    if (kind === "pdf") {
      const pdfParseModule = require("pdf-parse");
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      rawText = (await pdfParse(buffer)).text || "";
    } else if (kind === "docx") {
      const mammoth = require("mammoth");
      rawText = (await mammoth.extractRawText({ buffer })).value || "";
    } else if (kind === "text") {
      rawText = buffer.toString("utf-8");
    } else {
      rawText = htmlToText(buffer.toString("utf-8"));
    }

    if (rawText.trim().length < 50) {
      res.status(422).json({
        success: false,
        message:
          "Not enough readable text found at this URL. " +
          "If it's a login-protected page or a scanned PDF, please download and upload the file directly.",
      });
      return;
    }

    console.log(`🤖 Parsing URL content with Gemini (${rawText.length} chars)`);
    // ✅ FIXED: pass both required args — url (for resumeUrl field) + rawText (for parsing)
    const parsed = await parseResumeUrl(url, rawText);
    const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    const updatedJob = await Job.findById(jobId).lean();

    res.status(isNew ? 201 : 200).json({
      success: true,
      count:   isNew ? 1 : 0,
      applicant,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: isNew ? "Applicant imported from URL" : "Applicant already existed — linked to this job",
    });
  } catch (error: any) {
    console.error("❌ URL import error:", error);
    res.status(500).json({ success: false, message: "URL import failed: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/select-umurava
// ─────────────────────────────────────────────────────────────────────────────
export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;
    if (!jobId || !Array.isArray(profileIds) || profileIds.length === 0) {
      res.status(400).json({ success: false, message: "jobId and profileIds[] are required" });
      return;
    }

    const alreadyLinked    = await Applicant.find({ _id: { $in: profileIds }, jobIds: jobId }).select("_id");
    const alreadyLinkedIds = new Set(alreadyLinked.map((p) => String(p._id)));
    const newIds           = profileIds.filter((id: string) => !alreadyLinkedIds.has(String(id)));

    if (newIds.length === 0) {
      res.json({ success: true, count: 0, message: "All selected profiles are already linked to this job" });
      return;
    }

    await Applicant.updateMany({ _id: { $in: newIds } }, { $addToSet: { jobIds: jobId } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: newIds.length } });

    const updatedJob = await Job.findById(jobId).lean();

    res.json({
      success: true,
      count: newIds.length,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: `${newIds.length} profile${newIds.length !== 1 ? "s" : ""} added to job.`,
    });
  } catch (error: any) {
    console.error("❌ Umurava profile select error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/manual
// ─────────────────────────────────────────────────────────────────────────────
export const submitManualApplicant = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, ...profileData } = req.body;
    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }
    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      res.status(400).json({ success: false, message: "firstName, lastName, and email are required" });
      return;
    }

    const { applicant, isNew } = await linkApplicantToJob(
      { ...profileData, source: profileData.source || "external" },
      jobId
    );
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    const updatedJob = await Job.findById(jobId).lean();

    res.status(isNew ? 201 : 200).json({
      success: true,
      count: isNew ? 1 : 0,
      applicant,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: isNew ? "Applicant added successfully." : "Applicant already exists — linked to this job.",
    });
  } catch (error: any) {
    console.error("❌ Manual applicant error:", error);
    res.status(500).json({ success: false, message: "Manual applicant submit failed: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applicants/:jobId/applicant/:applicantId
// ─────────────────────────────────────────────────────────────────────────────
export const removeApplicantFromJob = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, applicantId } = req.params;

    if (!jobId || jobId === "undefined") {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }
    if (!applicantId || applicantId === "undefined") {
      res.status(400).json({ success: false, message: "applicantId is required" });
      return;
    }

    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      res.status(404).json({ success: false, message: "Applicant not found" });
      return;
    }

    applicant.jobIds = applicant.jobIds.filter((id) => String(id) !== String(jobId));

    if (applicant.jobIds.length === 0) {
      await Applicant.findByIdAndDelete(applicantId);
    } else {
      await applicant.save();
    }

    await ScreeningResult.updateMany(
      { jobId },
      { $pull: { rankedCandidates: { candidateId: applicant._id } } }
    );

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: -1 } });

    const updatedJob      = await Job.findById(jobId).lean();
    const applicantsCount = Math.max(0, (updatedJob as any)?.applicantsCount ?? 0);

    res.json({
      success: true,
      message: "Applicant removed from job successfully",
      applicantsCount,
    });
  } catch (error: any) {
    console.error("❌ Remove applicant error:", error);
    res.status(500).json({ success: false, message: "Failed to remove applicant: " + error.message });
  }
};