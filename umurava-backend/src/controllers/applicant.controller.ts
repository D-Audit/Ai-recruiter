// umurava-backend/src/controllers/applicant.controller.ts
//
// ✅ ZIP: extract → batch Gemini (50 files = 7 calls, not 50)
// ✅ Multi-person PDF: Gemini finds ALL CVs in one call
// ✅ Single PDF: synchronous instant response
// ✅ Duplicate detection: graceful per-file toast

import { Response } from "express";
import fs from "fs";
import path from "path";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import ScreeningResult from "../models/ScreeningResult.model";
import { parseCSVFile }  from "../services/csv.service";
import { parseXLSXFile } from "../services/xlsx.service";
import { parseResumeFile, parseResumeUrl } from "../services/resume.service";
import { extractZip }    from "../services/zip.service";
import { enqueueResumeJob, getQueueJob, FileResult } from "../services/queue.service";
import { parseMultiPersonPDF } from "../services/batch.resume.service";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cleanupFile(filePath?: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}

const BLOCKED_DOMAINS = ["linkedin.com","instagram.com","facebook.com","twitter.com","x.com","tiktok.com"];

async function fetchUrl(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? require("https") : require("http");
    const req = lib.request({
      hostname: parsedUrl.hostname, path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UmuravaAI/1.0)", "Accept": "text/html,application/pdf,*/*" },
      timeout: 15000,
    }, (response: any) => {
      if ([301,302,307,308].includes(response.statusCode) && response.headers.location) {
        return fetchUrl(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) return reject(new Error(`URL returned HTTP ${response.statusCode}`));
      const chunks: Buffer[] = [];
      response.on("data", (c: Buffer) => chunks.push(c));
      response.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType: response.headers["content-type"] || "" }));
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.end();
  });
}

function htmlToText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&[a-z]+;/gi," ").replace(/\s+/g," ").trim();
}

type UrlKind = "csv"|"xlsx"|"xls"|"pdf"|"docx"|"text"|"html";
function detectKind(ct: string, url: string): UrlKind {
  const c = ct.toLowerCase(), ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (c.includes("text/csv") || ext==="csv") return "csv";
  if (c.includes("vnd.ms-excel") || ext==="xls") return "xls";
  if (c.includes("spreadsheetml") || ext==="xlsx") return "xlsx";
  if (c.includes("application/pdf") || ext==="pdf") return "pdf";
  if (c.includes("wordprocessingml") || ext==="docx") return "docx";
  if (c.includes("text/plain") || ext==="txt") return "text";
  return "html";
}

async function linkApplicantToJob(profile: any, jobId: string): Promise<{ applicant: any; isNew: boolean }> {
  if (!profile.email || profile.email.trim() === "") {
    profile = { ...profile, email: `candidate.${Date.now()}.${Math.random().toString(36).slice(2,7)}@review.pending`, _emailMissing: true };
  }
  const existing = await Applicant.findOne({ email: profile.email.toLowerCase().trim() });
  if (existing) {
    const update: any = { $addToSet: { jobIds: jobId } };
    if (profile.resumeUrl && profile.resumeUrl !== existing.resumeUrl) update.$set = { resumeUrl: profile.resumeUrl };
    const updated = await Applicant.findByIdAndUpdate(existing._id, update, { new: true });
    return { applicant: updated || existing, isNew: false };
  }
  const applicant = await Applicant.create({ ...profile, email: profile.email.toLowerCase().trim(), jobIds: [jobId] });
  return { applicant, isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single-file fallback — synchronous, used by queue when batch fails
// ─────────────────────────────────────────────────────────────────────────────
async function processOneResumeFile(filePath: string, jobId: string): Promise<FileResult> {
  const fileName = path.basename(filePath);
  const ext      = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".pdf") {
      const pdfParseModule = require("pdf-parse");
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const { text } = await pdfParse(fs.readFileSync(filePath));
      const emailCount = (text?.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || []).length;

      if (emailCount >= 2) {
        console.log(`📋 Multi-person PDF: ${fileName} (${emailCount} emails)`);
        const profiles = await parseMultiPersonPDF(text || "", fileName);
        if (profiles.length > 1) {
          let firstResult: FileResult | null = null;
          for (let i = 0; i < profiles.length; i++) {
            const { applicant, isNew } = await linkApplicantToJob(profiles[i], jobId);
            if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
            if (i === 0) firstResult = toFileResult(`${fileName} (${profiles.length} found)`, applicant, !isNew);
          }
          cleanupFile(filePath);
          return firstResult || emptyResult(fileName);
        }
      }
    }

    const profile = await parseResumeFile(filePath);
    const { applicant, isNew } = await linkApplicantToJob(profile, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    return toFileResult(fileName, applicant, !isNew);
  } catch (err: any) {
    cleanupFile(filePath);
    throw err;
  }
}

function toFileResult(fileName: string, applicant: any, isExisting: boolean): FileResult {
  return {
    fileName,
    candidateName: `${applicant.firstName||""} ${applicant.lastName||""}`.trim() || "Unknown",
    email:         applicant.email || "",
    headline:      applicant.headline || "",
    location:      applicant.location || "",
    skillsCount:   (applicant.skills        || []).length,
    expCount:      (applicant.experience     || []).length,
    projectCount:  (applicant.projects       || []).length,
    eduCount:      (applicant.education      || []).length,
    certCount:     (applicant.certifications || []).length,
    isExisting,
  };
}

function emptyResult(fileName: string): FileResult {
  return { fileName, candidateName: fileName, email: "", headline: "", location: "", skillsCount: 0, expCount: 0, projectCount: 0, eduCount: 0, certCount: 0, isExisting: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find({ jobIds: req.params.jobId });
    res.json({ success: true, count: applicants.length, applicants });
  } catch { res.status(500).json({ success: false, message: "Failed to get applicants" }); }
};

export const getApplicantById = async (req: any, res: Response): Promise<void> => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) { res.status(404).json({ success: false, message: "Applicant not found" }); return; }
    res.json({ success: true, applicant });
  } catch { res.status(500).json({ success: false, message: "Failed to get applicant" }); }
};

export const getUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const profiles = await Applicant.find({ source: "umurava" }).limit(200);
    res.json({ success: true, count: profiles.length, profiles });
  } catch { res.status(500).json({ success: false, message: "Failed to get Umurava profiles" }); }
};

export const getQueueStatus = async (req: any, res: Response): Promise<void> => {
  try {
    const job = getQueueJob(req.params.queueId);
    if (!job) { res.status(404).json({ success: false, message: "Queue job not found or expired" }); return; }
    res.json({ success: true, ...job });
  } catch { res.status(500).json({ success: false, message: "Failed to get queue status" }); }
};

export const uploadCSV = async (req: any, res: Response): Promise<void> => {
  const filePath = req.file?.path;
  try {
    if (!req.file || !req.body.jobId) { res.status(400).json({ success: false, message: !req.file ? "No file uploaded" : "jobId required" }); return; }
    const parsed = await parseCSVFile(filePath);
    if (!parsed.length) { res.status(400).json({ success: false, message: "No valid rows found. Check firstName/lastName/email columns." }); return; }
    const inserted = await Applicant.insertMany(parsed.map(p => ({ ...p, jobIds: [req.body.jobId] })), { ordered: false }).catch(e => e.code===11000||e.writeErrors ? e.insertedDocs||[] : (() => { throw e; })());
    const count = Array.isArray(inserted) ? inserted.length : 0;
    if (count > 0) await Job.findByIdAndUpdate(req.body.jobId, { $inc: { applicantsCount: count } });
    const updatedJob = await Job.findById(req.body.jobId).lean();
    res.json({ success: true, count, applicantsCount: (updatedJob as any)?.applicantsCount??0, message: `${count} applicant${count!==1?"s":""} uploaded${parsed.length>count?` (${parsed.length-count} duplicates skipped)`:""}` });
  } catch (e: any) { res.status(500).json({ success: false, message: "CSV upload failed: "+e.message }); }
  finally { cleanupFile(filePath); }
};

// POST /api/applicants/upload/resume — single=sync, multiple=batch queue
export const uploadResume = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }

    const files: Express.Multer.File[] = req.files
      ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat() as Express.Multer.File[])
      : req.file ? [req.file] : [];

    if (!files.length) { res.status(400).json({ success: false, message: "No files uploaded" }); return; }

    if (files.length === 1) {
      const result = await processOneResumeFile(files[0].path, jobId);
      const updatedJob = await Job.findById(jobId).lean();
      res.json({ success: true, count: result.isExisting?0:1, applicantsCount: (updatedJob as any)?.applicantsCount??0, results: [result], message: result.isExisting?"Candidate already exists — linked.":"Resume parsed and candidate saved." });
      return;
    }

    const queueId = await enqueueResumeJob(files.map(f=>f.path), jobId, processOneResumeFile);
    const batchCalls = Math.ceil(files.length/8);
    res.json({ success: true, queued: true, queueId, total: files.length, message: `${files.length} files queued — ${batchCalls} Gemini call${batchCalls!==1?"s":""} (batched, not ${files.length} separate calls).` });
  } catch (e: any) { res.status(500).json({ success: false, message: "Resume upload failed: "+e.message }); }
};

// POST /api/applicants/upload/zip
export const uploadZip = async (req: any, res: Response): Promise<void> => {
  const zipPath = req.file?.path;
  try {
    if (!req.file || !req.body.jobId) { cleanupFile(zipPath); res.status(400).json({ success: false, message: !req.file?"No ZIP uploaded":"jobId required" }); return; }
    console.log(`📦 Extracting ZIP: ${req.file.originalname}`);
    const { files, skipped } = await extractZip(zipPath, "uploads/");
    cleanupFile(zipPath);
    if (!files.length) { res.status(400).json({ success: false, message: `No resume files in ZIP. ${skipped.length} skipped.` }); return; }
    console.log(`📦 ZIP: ${files.length} files to batch-parse`);
    const queueId   = await enqueueResumeJob(files.map(f=>f.filePath), req.body.jobId, processOneResumeFile);
    const batchCalls= Math.ceil(files.length/8);
    res.json({ success: true, queued: true, queueId, total: files.length, skipped: skipped.length, skippedDetail: skipped.slice(0,10), message: `ZIP opened — ${files.length} resume${files.length!==1?"s":""} queued. ${batchCalls} Gemini call${batchCalls!==1?"s":""} instead of ${files.length}.` });
  } catch (e: any) { cleanupFile(zipPath); res.status(500).json({ success: false, message: "ZIP upload failed: "+e.message }); }
};

export const uploadFromURL = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, url } = req.body;
    if (!jobId||!url) { res.status(400).json({ success: false, message: "jobId and url are required" }); return; }
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { res.status(400).json({ success: false, message: "Invalid URL" }); return; }
    if (BLOCKED_DOMAINS.some(d=>parsedUrl.hostname.includes(d))) { res.status(400).json({ success: false, message: "LinkedIn/social media URLs not supported. Please upload the PDF directly." }); return; }
    const { buffer, contentType } = await fetchUrl(url);
    const kind = detectKind(contentType, url);
    let rawText = "";
    if (kind==="pdf") { const m=require("pdf-parse"); rawText=(await (m.default??m)(buffer)).text||""; }
    else if (kind==="docx") { rawText=(await require("mammoth").extractRawText({buffer})).value||""; }
    else if (kind==="text") rawText=buffer.toString("utf-8");
    else rawText=htmlToText(buffer.toString("utf-8"));
    if (rawText.trim().length<50) { res.status(422).json({ success: false, message: "Not enough text at this URL. Upload the file directly." }); return; }
    const parsed = await parseResumeUrl(url, rawText);
    const { applicant, isNew } = await linkApplicantToJob(parsed, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    const updatedJob = await Job.findById(jobId).lean();
    res.status(isNew?201:200).json({ success: true, count: isNew?1:0, applicant, applicantsCount: (updatedJob as any)?.applicantsCount??0, message: isNew?"Applicant imported from URL":"Already existed — linked to job" });
  } catch (e: any) { res.status(500).json({ success: false, message: "URL import failed: "+e.message }); }
};

export const submitManualApplicant = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, ...profileData } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }
    if (!profileData.firstName||!profileData.lastName||!profileData.email) { res.status(400).json({ success: false, message: "firstName, lastName, and email are required" }); return; }
    const { applicant, isNew } = await linkApplicantToJob({ ...profileData, source: profileData.source||"external" }, jobId);
    if (isNew) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    const updatedJob = await Job.findById(jobId).lean();
    res.status(isNew?201:200).json({ success: true, count: isNew?1:0, applicant, applicantsCount: (updatedJob as any)?.applicantsCount??0, message: isNew?"Applicant added.":"Already exists — linked." });
  } catch (e: any) { res.status(500).json({ success: false, message: "Manual submit failed: "+e.message }); }
};

export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;
    if (!jobId||!Array.isArray(profileIds)||!profileIds.length) { res.status(400).json({ success: false, message: "jobId and profileIds[] required" }); return; }
    const existing    = await Applicant.find({ _id: { $in: profileIds }, jobIds: jobId }).select("_id");
    const existingIds = new Set(existing.map(p=>String(p._id)));
    const newIds      = profileIds.filter((id: string)=>!existingIds.has(String(id)));
    if (!newIds.length) { res.json({ success: true, count: 0, message: "All profiles already linked" }); return; }
    await Applicant.updateMany({ _id: { $in: newIds } }, { $addToSet: { jobIds: jobId } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: newIds.length } });
    const updatedJob = await Job.findById(jobId).lean();
    res.json({ success: true, count: newIds.length, applicantsCount: (updatedJob as any)?.applicantsCount??0, message: `${newIds.length} profile${newIds.length!==1?"s":""} added.` });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
};

export const removeApplicantFromJob = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, applicantId } = req.params;
    if (!jobId||jobId==="undefined"||!applicantId||applicantId==="undefined") { res.status(400).json({ success: false, message: "jobId and applicantId required" }); return; }
    const applicant = await Applicant.findById(applicantId);
    if (!applicant) { res.status(404).json({ success: false, message: "Applicant not found" }); return; }
    applicant.jobIds = applicant.jobIds.filter(id=>String(id)!==String(jobId));
    if (!applicant.jobIds.length) await Applicant.findByIdAndDelete(applicantId);
    else await applicant.save();
    await ScreeningResult.updateMany({ jobId }, { $pull: { rankedCandidates: { candidateId: applicant._id } } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: -1 } });
    const updatedJob = await Job.findById(jobId).lean();
    res.json({ success: true, message: "Removed successfully", applicantsCount: Math.max(0,(updatedJob as any)?.applicantsCount??0) });
  } catch (e: any) { res.status(500).json({ success: false, message: "Remove failed: "+e.message }); }
};