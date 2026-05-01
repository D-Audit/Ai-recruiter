// umurava-backend/src/controllers/applicant.controller.ts

import { Response } from "express";
import fs from "fs";
import path from "path";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { parseCSVFile }          from "../services/csv.service";
import { parseXLSXFile }         from "../services/xlsx.service";
import { parseResumeFile, parseResumeUrl } from "../services/resume.service";
import { extractZip }            from "../services/zip.service";
import { splitMultiPersonPDF }   from "../services/pdf.splitter.service";
import { enqueueResumeJob, getQueueJob, FileResult } from "../services/queue.service";

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
    request.on("timeout", () => { request.destroy(); reject(new Error("Request timed out after 15 seconds")); });
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

async function processOneResumeFile(filePath: string, jobId: string): Promise<FileResult> {
  const fileName = path.basename(filePath);
  const ext      = path.extname(filePath).toLowerCase();

  try {
  
    if (ext === ".pdf") {
      const pdfParseModule = require("pdf-parse");
      const pdfParse       = pdfParseModule.default ?? pdfParseModule;
      const buffer         = fs.readFileSync(filePath);
      const { text }       = await pdfParse(buffer);

      const { blocks, wasMulti } = splitMultiPersonPDF(text || "");

      if (wasMulti && blocks.length > 1) {
        console.log(`📋 Multi-person PDF detected: ${fileName} — ${blocks.length} candidates`);
        let firstResult: FileResult | null = null;
        let newCount = 0;

        for (let i = 0; i < blocks.length; i++) {
          const blockText = blocks[i];
          
          const tmpPath = filePath.replace(ext, `_person${i + 1}${ext}`);
          
          const { parseResumeUrl: parseText } = await import("../services/resume.service");
          const profile = await parseText(`block_${i}_${fileName}`, blockText);
          const { applicant, isNew } = await linkApplicantToJob(profile, jobId);
          if (isNew) {
            newCount++;
            await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
          }
          if (i === 0) {
            firstResult = {
              fileName:      `${fileName} (person ${i + 1} of ${blocks.length})`,
              candidateName: `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || "Unknown",
              email:         applicant.email || "",
              headline:      applicant.headline || "",
              location:      applicant.location || "",
              skillsCount:   (applicant.skills        || []).length,
              expCount:      (applicant.experience     || []).length,
              projectCount:  (applicant.projects       || []).length,
              eduCount:      (applicant.education      || []).length,
              certCount:     (applicant.certifications || []).length,
              isExisting:    !isNew,
            };
          }
        }

        cleanupFile(filePath);
        return firstResult || {
          fileName, candidateName: fileName, email: "", headline: "",
          location: "", skillsCount: 0, expCount: 0, projectCount: 0,
          eduCount: 0, certCount: 0, isExisting: false,
        };
      }
    }

    const profile = await parseResumeFile(filePath);
    const { applicant, isNew } = await linkApplicantToJob(profile, jobId);

    if (isNew) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    }

    return {
      fileName,
      candidateName: `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim() || "Unknown",
      email:         applicant.email || "",
      headline:      applicant.headline || "",
      location:      applicant.location || "",
      skillsCount:   (applicant.skills        || []).length,
      expCount:      (applicant.experience     || []).length,
      projectCount:  (applicant.projects       || []).length,
      eduCount:      (applicant.education      || []).length,
      certCount:     (applicant.certifications || []).length,
      isExisting:    !isNew,
    };
  } catch (err: any) {
    cleanupFile(filePath);
    throw err;
  }
}

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find({ jobIds: req.params.jobId });
    res.json({ success: true, count: applicants.length, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get applicants" });
  }
};

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

export const getUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const profiles = await Applicant.find({ source: "umurava" }).limit(200);
    res.json({ success: true, count: profiles.length, profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get Umurava profiles" });
  }
};

export const getQueueStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const job = getQueueJob(req.params.queueId);
    if (!job) {
      res.status(404).json({ success: false, message: "Queue job not found" });
      return;
    }
    res.json({ success: true, ...job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Failed to get queue status" });
  }
};

export const uploadCSV = async (req: any, res: Response): Promise<void> => {
  const filePath = req.file?.path;
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }

    const parsed = await parseCSVFile(filePath);
    if (parsed.length === 0) {
      res.status(400).json({ success: false, message: "No valid rows found in CSV. Check that it has firstName/lastName/email columns." });
      return;
    }

    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted   = await Applicant.insertMany(applicants, { ordered: false }).catch((e) => {
      if (e.code === 11000 || e.writeErrors) return e.insertedDocs || [];
      throw e;
    });

    const count = Array.isArray(inserted) ? inserted.length : 0;
    if (count > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: count } });

    const updatedJob = await Job.findById(jobId).lean();
    res.json({
      success: true, count,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: `${count} applicant${count !== 1 ? "s" : ""} uploaded from CSV${parsed.length > count ? ` (${parsed.length - count} duplicates skipped)` : ""}`,
    });
  } catch (error: any) {
    console.error("❌ CSV upload error:", error);
    res.status(500).json({ success: false, message: "CSV upload failed: " + error.message });
  } finally {
    cleanupFile(filePath);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applicants/upload/resume  (single OR multiple files)
//
// ✅ FIXED: responds IMMEDIATELY with a queueId — no more Railway 30s timeout.
// Processing happens in the background. Frontend polls /queue/:queueId for progress.
// ─────────────────────────────────────────────────────────────────────────────
export const uploadResume = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }

    // Support both single (req.file) and multiple (req.files) uploads
    const files: Express.Multer.File[] = req.files
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      : req.file ? [req.file] : [];

    if (files.length === 0) {
      res.status(400).json({ success: false, message: "No files uploaded" });
      return;
    }

    const filePaths = files.map((f) => f.path);

    if (files.length === 1) {
      const result = await processOneResumeFile(filePaths[0], jobId);
      const updatedJob = await Job.findById(jobId).lean();

      const savedApplicant = result.email
        ? await Applicant.findOne({ email: result.email }).lean()
        : null;
      res.json({
        success:   true,
        count:     result.isExisting ? 0 : 1,
        applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
        applicant: savedApplicant,
      
        results:   [{ ...result, status: result.isExisting ? "linked" : "created" }],
        message:   result.isExisting ? "Candidate already exists — linked to job." : "Resume parsed and candidate added.",
      });
      return;
    }

    const queueId = await enqueueResumeJob(filePaths, jobId, processOneResumeFile);

    res.json({
      success:   true,
      queued:    true,
      queueId,
      total:     files.length,
      message:   `Processing ${files.length} files in the background. Poll /api/applicants/queue/${queueId} for progress.`,
    });

  } catch (error: any) {
    console.error("❌ Resume upload error:", error);
    res.status(500).json({ success: false, message: "Resume upload failed: " + error.message });
  }
};


export const uploadZip = async (req: any, res: Response): Promise<void> => {
  const zipPath = req.file?.path;
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No ZIP file uploaded" });
      return;
    }
    const { jobId } = req.body;
    if (!jobId) {
      cleanupFile(zipPath);
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }
    console.log(`📦 Extracting ZIP: ${req.file.originalname}`);
    const { files, skipped, total } = await extractZip(zipPath, "uploads/");

    cleanupFile(zipPath);

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        message: `No supported resume files found in the ZIP. ${skipped.length} files were skipped (${skipped.map(s => s.reason).join(", ")}).`,
      });
      return;
    }

    console.log(`📦 ZIP extracted: ${files.length} files to process, ${skipped.length} skipped`);

    const filePaths = files.map((f) => f.filePath);
    const queueId   = await enqueueResumeJob(filePaths, jobId, processOneResumeFile);

    res.json({
      success:       true,
      queued:        true,
      queueId,
      total:         files.length,
      skipped:       skipped.length,
      skippedDetail: skipped,
      message:       `ZIP opened — ${files.length} resume${files.length !== 1 ? "s" : ""} queued for processing. Poll /api/applicants/queue/${queueId} for live progress.`,
    });

  } catch (error: any) {
    console.error("❌ ZIP upload error:", error);
    cleanupFile(zipPath);
    res.status(500).json({ success: false, message: "ZIP upload failed: " + error.message });
  }
};

export const uploadFromURL = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, url } = req.body;
    if (!jobId || !url) {
      res.status(400).json({ success: false, message: "jobId and url are required" });
      return;
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); }
    catch {
      res.status(400).json({ success: false, message: "Invalid URL format. Provide a full URL including https://" });
      return;
    }

    const isBlocked = BLOCKED_DOMAINS.some((d) => parsedUrl.hostname.includes(d));
    if (isBlocked) {
      res.status(400).json({
        success: false,
        message: "LinkedIn and social media URLs cannot be imported automatically. Please download the resume as PDF and upload it directly.",
      });
      return;
    }

    console.log(`🌐 Fetching URL: ${url}`);
    const { buffer, contentType } = await fetchUrl(url);
    const kind = detectKind(contentType, url);

    if (kind === "csv" || kind === "xlsx" || kind === "xls") {
      const XLSX = require("xlsx");
      const workbook = kind === "csv"
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
          source: "external", jobIds: [jobId],
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
      const updatedJob = await Job.findById(jobId).lean();
      res.json({ success: true, count, applicantsCount: (updatedJob as any)?.applicantsCount ?? 0, message: `${count} applicants imported from URL` });
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
      res.status(422).json({ success: false, message: "Not enough readable text at this URL. Download and upload the file directly." });
      return;
    }

    const parsed = await parseResumeUrl(url, rawText);
    const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    const updatedJob = await Job.findById(jobId).lean();
    res.status(isNew ? 201 : 200).json({
      success: true,
      count: isNew ? 1 : 0,
      applicant,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: isNew ? "Applicant imported from URL" : "Applicant already existed — linked to this job",
    });
  } catch (error: any) {
    console.error("❌ URL import error:", error);
    res.status(500).json({ success: false, message: "URL import failed: " + error.message });
  }
};


export const submitManualApplicant = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, ...profileData } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }
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
      success: true, count: isNew ? 1 : 0, applicant,
      applicantsCount: (updatedJob as any)?.applicantsCount ?? 0,
      message: isNew ? "Applicant added successfully." : "Applicant already exists — linked to this job.",
    });
  } catch (error: any) {
    console.error("❌ Manual applicant error:", error);
    res.status(500).json({ success: false, message: "Manual applicant submit failed: " + error.message });
  }
};

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

export const removeApplicantFromJob = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, applicantId } = req.params;
    if (!jobId || jobId === "undefined") { res.status(400).json({ success: false, message: "jobId is required" }); return; }
    if (!applicantId || applicantId === "undefined") { res.status(400).json({ success: false, message: "applicantId is required" }); return; }

    const applicant = await Applicant.findById(applicantId);
    if (!applicant) { res.status(404).json({ success: false, message: "Applicant not found" }); return; }

    applicant.jobIds = applicant.jobIds.filter((id) => String(id) !== String(jobId));
    if (applicant.jobIds.length === 0) {
      await Applicant.findByIdAndDelete(applicantId);
    } else {
      await applicant.save();
    }

    await ScreeningResult.updateMany({ jobId }, { $pull: { rankedCandidates: { candidateId: applicant._id } } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: -1 } });

    const updatedJob      = await Job.findById(jobId).lean();
    const applicantsCount = Math.max(0, (updatedJob as any)?.applicantsCount ?? 0);

    res.json({ success: true, message: "Applicant removed from job successfully", applicantsCount });
  } catch (error: any) {
    console.error("❌ Remove applicant error:", error);
    res.status(500).json({ success: false, message: "Failed to remove applicant: " + error.message });
  }
};