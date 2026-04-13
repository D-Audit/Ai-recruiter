import { Response } from "express";
import fs from "fs";
import Applicant from "../models/Applicant.model";
import Job from "../models/Job.model";
import { parseCSVFile } from "../services/csv.service";
import { parsePDFResume } from "../services/pdf.service";
import { parseXLSXFile } from "../services/xlsx.service";
import { parseResumeFile } from "../services/resume.service";
import { callGeminiWithRetry } from "../services/ai.service";

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

export const getApplicants = async (req: any, res: Response): Promise<void> => {
  try {
    const applicants = await Applicant.find({ jobIds: req.params.jobId });
    res.json({ success: true, count: applicants.length, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get applicants" });
  }
};

export const getUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const profiles = await Applicant.find({ source: "umurava" }).limit(200);
    res.json({ success: true, count: profiles.length, profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get profiles" });
  }
};

export const uploadCSV = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }

    const parsed = await parseCSVFile(req.file.path);
    if (parsed.length === 0) {
      res.status(400).json({ success: false, message: "No valid rows in CSV." });
      return;
    }

    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted = await Applicant.insertMany(applicants, { ordered: false }).catch((e) => {
      if (e.code === 11000 || e.writeErrors) return e.insertedDocs || [];
      throw e;
    });

    const count = Array.isArray(inserted) ? inserted.length : 0;
    if (count > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: count } });

    res.json({ success: true, count, message: `${count} applicants uploaded from CSV` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "CSV upload failed: " + error.message });
  }
};

export const uploadPDF = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }

    const parsed = await parsePDFResume(req.file.path);
    if (!parsed.email) {
      res.status(400).json({ success: false, message: "Could not extract applicant information from PDF" });
      return;
    }

    const applicant = await Applicant.create({ ...parsed, jobIds: [jobId] });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
    res.status(201).json({ success: true, count: 1, applicant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "PDF upload failed: " + error.message });
  }
};

export const uploadXLSX = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ success: false, message: "jobId is required" }); return; }

    const parsed = await parseXLSXFile(req.file.path);
    if (parsed.length === 0) {
      res.status(400).json({ success: false, message: "No valid rows in XLSX." });
      return;
    }

    const applicants = parsed.map((p) => ({ ...p, jobIds: [jobId] }));
    const inserted = await Applicant.insertMany(applicants, { ordered: false }).catch((e) => {
      if (e.code === 11000 || e.writeErrors) return e.insertedDocs || [];
      throw e;
    });

    const count = Array.isArray(inserted) ? inserted.length : 0;
    if (count > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: count } });

    res.json({ success: true, count, message: `${count} applicants uploaded from XLSX` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "XLSX upload failed: " + error.message });
  }
};

export const selectUmuravaProfiles = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, profileIds } = req.body;
    if (!jobId || !profileIds?.length) { res.status(400).json({ success: false, message: "jobId and profileIds required" }); return; }

    const alreadyLinked = await Applicant.find({ _id: { $in: profileIds }, jobIds: jobId }).select("_id");
    const alreadyLinkedIds = new Set(alreadyLinked.map((p) => String(p._id)));
    const newProfileIds = profileIds.filter((id: string) => !alreadyLinkedIds.has(String(id)));

    if (newProfileIds.length === 0) {
      res.json({ success: true, count: 0, message: "All selected profiles are already linked" });
      return;
    }

    await Applicant.updateMany({ _id: { $in: newProfileIds } }, { $addToSet: { jobIds: jobId } });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: newProfileIds.length } });

    res.json({ success: true, count: newProfileIds.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadResume = async (req: any, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: "No file uploaded" }); return; }
    const { jobId } = req.body;
    if (!jobId) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ success: false, message: "jobId is required" }); return;
    }

    const parsed = await parseResumeFile(req.file.path);
    if (!parsed.email) {
      res.status(400).json({ success: false, message: "Could not extract applicant info" });
      return;
    }

    const applicant = await Applicant.create({ ...parsed, jobIds: [jobId], resumeUrl: "" });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.status(201).json({ success: true, count: 1, applicant });
  } catch (error: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Resume upload failed: " + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED URL IMPORT LOGIC
// ─────────────────────────────────────────────────────────────────────────────

async function parseTextWithGemini(text: string): Promise<any> {
  const prompt = `Extract the following information from this resume/profile text and return ONLY a valid JSON object with no explanation, no markdown, no backticks.
{ "firstName": "", "lastName": "", "email": "", "headline": "", "bio": "", "location": "", "skills": [{ "name": "", "level": "Intermediate", "yearsOfExperience": 0 }], "languages": [{ "name": "", "proficiency": "Fluent" }], "experience": [{ "company": "", "role": "", "startDate": "", "endDate": "", "description": "", "technologies": [], "isCurrent": false }], "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startYear": 0, "endYear": 0 }], "certifications": [{ "name": "", "issuer": "", "issueDate": "" }], "projects": [{ "name": "", "description": "", "technologies": [], "role": "" }], "availability": { "status": "Available", "type": "Full-time", "startDate": "" }, "socialLinks": { "linkedin": "", "github": "", "portfolio": "" } }
Text: ${text.slice(0, 12000)}`;
  const raw = await callGeminiWithRetry(prompt);
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); } 
  catch { throw new Error("Gemini returned invalid JSON"); }
}

type FileKind = "csv" | "xlsx" | "xls" | "pdf" | "docx" | "html" | "text";

function detectKind(contentType: string, url: string): FileKind {
  const ct = contentType.toLowerCase();
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ct.includes("text/csv") || ext === "csv") return "csv";
  if (ct.includes("application/vnd.ms-excel") || ext === "xls") return "xls";
  if (ct.includes("spreadsheetml") || ct.includes("vnd.openxmlformats") || ext === "xlsx") return "xlsx";
  if (ct.includes("application/pdf") || ext === "pdf") return "pdf";
  if (ct.includes("wordprocessingml") || ct.includes("application/msword") || ext === "docx" || ext === "doc") return "docx";
  if (ct.includes("text/plain") || ext === "txt") return "text";
  return "html";
}

function parseSpreadsheetBuffer(buffer: Buffer, kind: "csv" | "xlsx" | "xls"): any[] {
  const XLSX = require("xlsx");
  const workbook = kind === "csv" ? XLSX.read(buffer.toString("utf-8"), { type: "string" }) : XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const results: any[] = [];
  
  for (const row of rows) {
    const firstName = (row.firstName || row.first_name || (row.name || "").split(" ")[0] || "").toString().trim();
    const lastName = (row.lastName || row.last_name || (row.name || "").split(" ").slice(1).join(" ") || "").toString().trim();
    const email = (row.email || row.Email || "").toString().trim();
    if (!(firstName || lastName) || !email) continue;

    results.push({
      firstName, lastName, email,
      headline: (row.headline || "").toString(),
      skills: [], languages: [], experience: [], education: [], certifications: [], projects: [],
      availability: { status: "Available", type: "Full-time", startDate: "" },
      socialLinks: { linkedin: "", github: "", portfolio: "" },
      source: "external",
    });
  }
  return results;
}

async function fetchUrl(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? require("https") : require("http");
    const req = lib.request({ hostname: parsedUrl.hostname, path: parsedUrl.pathname + parsedUrl.search, method: "GET", headers: { "User-Agent": "Mozilla/5.0" } }, (res: any) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) return fetchUrl(res.headers.location).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error(`URL returned HTTP ${res.statusCode}`));
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers["content-type"] || "" }));
    });
    req.on("error", reject); req.end();
  });
}

function htmlToText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

export const uploadFromURL = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, url } = req.body;
    if (!jobId || !url) { res.status(400).json({ success: false, message: "jobId and url are required" }); return; }

    const { buffer, contentType } = await fetchUrl(url);
    const kind = detectKind(contentType, url);

    if (kind === "csv" || kind === "xlsx" || kind === "xls") {
      const rows = parseSpreadsheetBuffer(buffer, kind);
      if (rows.length === 0) { res.status(400).json({ success: false, message: `No valid rows in URL file.` }); return; }
      
      const applicants = rows.map(r => ({ ...r, jobIds: [jobId] }));
      const inserted = await Applicant.insertMany(applicants, { ordered: false }).catch(e => e.insertedDocs || []);
      if (inserted.length > 0) await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: inserted.length } });
      res.json({ success: true, count: inserted.length });
      return;
    }

    let rawText = "";
    if (kind === "pdf") { const pdfParse = require("pdf-parse"); rawText = (await pdfParse(buffer)).text; }
    else if (kind === "docx") { const mammoth = require("mammoth"); rawText = (await mammoth.extractRawText({ buffer })).value; }
    else if (kind === "text") { rawText = buffer.toString("utf-8"); }
    else { rawText = htmlToText(buffer.toString("utf-8")); }

    if (rawText.length < 50) { res.status(422).json({ success: false, message: "Not enough text found at URL." }); return; }

    const parsed = await parseTextWithGemini(rawText);
    if (!parsed.email) { res.status(400).json({ success: false, message: "Could not extract complete profile." }); return; }

    const applicant = await Applicant.create({ ...parsed, jobIds: [jobId], source: "external", resumeUrl: url });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.status(201).json({ success: true, count: 1, applicant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "URL import failed: " + error.message });
  }
};

export const submitManualApplicant = async (req: any, res: Response): Promise<void> => {
  try {
    const { jobId, ...profileData } = req.body;

    if (!jobId) {
      res.status(400).json({ success: false, message: "jobId is required" });
      return;
    }

    if (!profileData.firstName || !profileData.lastName || !profileData.email) {
      res.status(400).json({
        success: false,
        message: "firstName, lastName, and email are required",
      });
      return;
    }

    const applicant = await Applicant.create({
      ...profileData,
      jobIds: [jobId],
      source: profileData.source || "external",
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.status(201).json({ success: true, count: 1, applicant });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Manual applicant submit failed: " + error.message,
    });
  }
};