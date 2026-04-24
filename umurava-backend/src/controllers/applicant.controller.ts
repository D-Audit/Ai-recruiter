// umurava-backend/src/controllers/applicant.controller.ts

import { Response } from "express";
import fs from "fs";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { parseCSVFile } from "../services/csv.service";
import { parsePDFResume, parseMultiPDFResume } from "../services/pdf.service";
import { parseXLSXFile } from "../services/xlsx.service";
import { parseResumeFile, parseResumeUrl } from "../services/resume.service";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely delete a temp file (non-fatal)
// ─────────────────────────────────────────────────────────────────────────────
function cleanupFile(filePath?: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: link an applicant to a job, handling duplicates gracefully
// Always returns the applicant (new or existing) so frontend can display it
// ─────────────────────────────────────────────────────────────────────────────
async function linkApplicantToJob(
  profile: any,
  jobId: string
): Promise<{ applicant: any; isNew: boolean }> {
  // Email is required to detect duplicates
  if (!profile.email || profile.email.trim() === "") {
    // Create with a unique placeholder so it still saves — recruiter can edit later
    const fallbackEmail = `candidate.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@review.pending`;
    profile = { ...profile, email: fallbackEmail, _emailMissing: true };
  }

  const existing = await Applicant.findOne({ email: profile.email.toLowerCase().trim() });

  if (existing) {
    // Existing applicant — link to this job and optionally update resumeUrl
    const update: any = { $addToSet: { jobIds: jobId } };
    if (profile.resumeUrl && profile.resumeUrl !== existing.resumeUrl) {
      update.$set = { resumeUrl: profile.resumeUrl };
    }
    const updated = await Applicant.findByIdAndUpdate(existing._id, update, { new: true });
    return { applicant: updated || existing, isNew: false };
  }

  // New applicant
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
// POST /api/applicants/upload/pdf
// Supports single or multiple PDFs
// ─────────────────────────────────────────────────────────────────────────────
export const uploadPDF = async (req: any, res: Response): Promise<void> => {
  const files: Express.Multer.File[] = req.files?.length
    ? (req.files as Express.Multer.File[])
    : req.file
    ? [req.file]
    : [];

  if (files.length === 0) {
    res.status(400).json({ success: false, message: "No file(s) uploaded" });
    return;
  }

  const { jobId } = req.body;
  if (!jobId) {
    files.forEach(f => cleanupFile(f.path));
    res.status(400).json({ success: false, message: "jobId is required" });
    return;
  }

  const results: {
    file: string;
    status: "created" | "linked" | "error";
    name?: string;
    applicant?: any;
    error?: string;
  }[] = [];
  let totalAdded = 0;

  for (const file of files) {
    try {
      console.log(`📄 Parsing PDF: ${file.originalname}`);
      const parsed = await parsePDFResume(file.path);
      const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);

      if (isNew) {
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
        totalAdded++;
      }

      results.push({
        file:      file.originalname,
        status:    isNew ? "created" : "linked",
        name:      `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || file.originalname,
        applicant, // always return applicant so frontend can display it
      });
    } catch (error: any) {
      console.error(`❌ PDF upload error for ${file.originalname}:`, error);
      cleanupFile(file.path);
      results.push({ file: file.originalname, status: "error", error: error.message });
    }
  }

  const successCount = results.filter(r => r.status !== "error").length;
  const errorCount   = results.filter(r => r.status === "error").length;

  if (successCount === 0 && errorCount > 0) {
    res.status(500).json({ success: false, message: "All PDF uploads failed", results });
    return;
  }

  const httpStatus =
    successCount > 0 && files.length === 1
      ? results[0].status === "created" ? 201 : 200
      : 200;

  res.status(httpStatus).json({
    success: true,
    count:   totalAdded,
    message: `${successCount} PDF${successCount !== 1 ? "s" : ""} processed${
      errorCount > 0 ? `, ${errorCount} failed` : ""
    }`,
    results,
    applicant: results.find(r => r.applicant)?.applicant, // backward compat
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/xlsx
// ─────────────────────────────────────────────────────────────────────────────
export const uploadXLSX = async (req: any, res: Response): Promise<void> => {
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

    const parsed = await parseXLSXFile(filePath);
    if (parsed.length === 0) {
      res.status(400).json({ success: false, message: "No valid rows found in XLSX." });
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
      message: `${count} applicant${count !== 1 ? "s" : ""} uploaded from XLSX`,
    });
  } catch (error: any) {
    console.error("❌ XLSX upload error:", error);
    res.status(500).json({ success: false, message: "XLSX upload failed: " + error.message });
  } finally {
    cleanupFile(filePath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/resume
// Generic resume handler: PDF, DOCX, DOC, TXT, ODT — single or multiple files
// Always returns the applicant object (new or existing) for frontend display
// ─────────────────────────────────────────────────────────────────────────────
export const uploadResume = async (req: any, res: Response): Promise<void> => {
  const files: Express.Multer.File[] = req.files?.length
    ? (req.files as Express.Multer.File[])
    : req.file
    ? [req.file]
    : [];

  if (files.length === 0) {
    res.status(400).json({ success: false, message: "No file(s) uploaded" });
    return;
  }

  const { jobId } = req.body;
  if (!jobId) {
    files.forEach(f => cleanupFile(f.path));
    res.status(400).json({ success: false, message: "jobId is required" });
    return;
  }

  const results: {
    file: string;
    status: "created" | "linked" | "error";
    applicant?: any;
    error?: string;
  }[] = [];
  let totalAdded = 0;

  for (const file of files) {
    try {
      console.log(`📄 Parsing resume: ${file.originalname}`);
      const parsed = await parseResumeFile(file.path);
      const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);

      if (isNew) {
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
        totalAdded++;
      }

      results.push({
        file:      file.originalname,
        status:    isNew ? "created" : "linked",
        applicant, // ✅ FIXED: always return applicant, not just for new ones
      });

      if (isNew) {
        console.log(`✅ New applicant created: ${applicant.firstName} ${applicant.lastName}`);
      } else {
        console.log(`🔗 Existing applicant linked: ${applicant.firstName} ${applicant.lastName}`);
      }
    } catch (error: any) {
      console.error(`❌ Resume upload error for ${file.originalname}:`, error);
      cleanupFile(file.path);
      results.push({ file: file.originalname, status: "error", error: error.message });
    }
  }

  const successCount = results.filter(r => r.status !== "error").length;
  const errorCount   = results.filter(r => r.status === "error").length;

  if (successCount === 0 && errorCount > 0) {
    res.status(500).json({
      success: false,
      message: "All resume uploads failed",
      results,
    });
    return;
  }

  const firstApplicant = results.find(r => r.applicant)?.applicant;
  const httpStatus =
    successCount > 0 && files.length === 1
      ? results[0].status === "created" ? 201 : 200
      : 200;

  res.status(httpStatus).json({
    success:   true,
    count:     totalAdded,
    applicant: firstApplicant, // backward compat for single-file callers
    message: `${successCount} resume${successCount !== 1 ? "s" : ""} processed${
      errorCount > 0 ? `, ${errorCount} failed` : ""
    }`,
    results,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/url
// ─────────────────────────────────────────────────────────────────────────────

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

    const isBlocked = BLOCKED_DOMAINS.some(d => parsedUrl.hostname.includes(d));
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
    const parsed = await parseResumeUrl(url, rawText);
    const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.status(isNew ? 201 : 200).json({
      success:   true,
      count:     isNew ? 1 : 0,
      applicant,
      message:   isNew ? "Applicant imported from URL" : "Applicant already existed — linked to this job",
    });
  } catch (error: any) {
    console.error("❌ URL import error:", error);
    res.status(500).json({ success: false, message: "URL import failed: " + error.message });
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

    res.status(isNew ? 201 : 200).json({ success: true, count: isNew ? 1 : 0, applicant });
  } catch (error: any) {
    console.error("❌ Manual applicant error:", error);
    res.status(500).json({ success: false, message: "Manual applicant submit failed: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/select (Umurava profiles)
// ─────────────────────────────────────────────────────────────────────────────
export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;
    if (!jobId || !profileIds?.length) {
      res.status(400).json({ success: false, message: "jobId and profileIds are required" });
      return;
    }

    const alreadyLinked    = await Applicant.find({ _id: { $in: profileIds }, jobIds: jobId }).select("_id");
    const alreadyLinkedIds = new Set(alreadyLinked.map(p => String(p._id)));
    const newIds           = profileIds.filter((id: string) => !alreadyLinkedIds.has(String(id)));

    if (newIds.length === 0) {
      res.json({ success: true, count: 0, message: "All selected profiles are already linked to this job" });
      return;
    }

    await Applicant.updateMany({ _id: { $in: newIds } }, { $addToSet: { jobIds: jobId } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: newIds.length } });

    res.json({ success: true, count: newIds.length });
  } catch (error: any) {
    console.error("❌ Umurava profile select error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/applicants/:jobId/applicant/:applicantId
// ─────────────────────────────────────────────────────────────────────────────
export const removeApplicantFromJob = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, applicantId } = req.params;

    const applicant = await Applicant.findById(applicantId);
    if (!applicant) {
      res.status(404).json({ success: false, message: "Applicant not found" });
      return;
    }

    applicant.jobIds = applicant.jobIds.filter(id => String(id) !== String(jobId));

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

    res.json({ success: true, message: "Applicant removed from job successfully" });
  } catch (error: any) {
    console.error("❌ Remove applicant error:", error);
    res.status(500).json({ success: false, message: "Failed to remove applicant: " + error.message });
  }
};