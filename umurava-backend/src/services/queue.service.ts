// umurava-backend/src/services/queue.service.ts
//
// ✅ Background queue with BATCH Gemini parsing.
//
// OLD: 1 Gemini call per file → 50 files = 50 calls → rate limit risk
// NEW: 1 Gemini call per 8 files → 50 files = 7 calls → fast & safe
//
// How it works:
//   1. Controller calls enqueueResumeJob(files, jobId) → returns queueId instantly
//   2. HTTP request responds immediately (no timeout risk)
//   3. Worker extracts text from all files, batches them to Gemini
//   4. Saves all results to MongoDB
//   5. Frontend polls GET /api/applicants/queue/:queueId for live progress

import { batchParseResumes, parseMultiPersonPDF, ResumeInput } from "./batch.resume.service";
import fs from "fs";
import path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

export type FileResult = {
  fileName:      string;
  candidateName: string;
  email:         string;
  headline:      string;
  location:      string;
  skillsCount:   number;
  expCount:      number;
  projectCount:  number;
  eduCount:      number;
  certCount:     number;
  isExisting:    boolean;
  error?:        string;
};

export type QueueJob = {
  id:          string;
  jobId:       string;
  total:       number;         // total files enqueued
  done:        number;         // finished (success or fail)
  succeeded:   number;         // new applicants saved
  duplicates:  number;         // already existed, linked
  failed:      number;         // errors
  results:     FileResult[];
  status:      "pending" | "processing" | "done" | "error";
  startedAt:   number;
  finishedAt?: number;
  error?:      string;
};

// ── In-memory store ──────────────────────────────────────────────────────────

const jobs = new Map<string, QueueJob>();

// Auto-cleanup jobs older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (job.startedAt < cutoff) jobs.delete(id);
  }
}, 30 * 60 * 1000);

function makeId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getQueueJob(id: string): QueueJob | undefined {
  return jobs.get(id);
}

// ── Text extraction helper ───────────────────────────────────────────────────

async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const pdfParseModule = require("pdf-parse");
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || "";
    }
    if (ext === ".docx" || ext === ".doc") {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    }
    if (ext === ".txt" || ext === ".odt") {
      return fs.readFileSync(filePath, "utf-8");
    }
    return fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    console.warn(`⚠️  Text extraction failed for ${filePath}:`, e);
    return "";
  }
}

function cleanupFile(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}

// ── Batch queue worker ───────────────────────────────────────────────────────
// Called by processFile function provided by controller for single-file fallback
export type ProcessFileFn = (filePath: string, jobId: string) => Promise<FileResult>;

/**
 * Enqueue files for BATCH background processing.
 * Uses batchParseResumes() to send groups of files to Gemini at once.
 *
 * @param filePaths    - Array of local file paths to process
 * @param mongoJobId   - The MongoDB job ID (for linking applicants)
 * @param processFile  - Single-file fallback function (used when batch fails)
 */
export async function enqueueResumeJob(
  filePaths: string[],
  mongoJobId: string,
  processFile: ProcessFileFn
): Promise<string> {
  const id = makeId();

  const job: QueueJob = {
    id,
    jobId:      mongoJobId,
    total:      filePaths.length,
    done:       0,
    succeeded:  0,
    duplicates: 0,
    failed:     0,
    results:    [],
    status:     "pending",
    startedAt:  Date.now(),
  };

  jobs.set(id, job);

  // Fire-and-forget — runs in background after HTTP response is sent
  setImmediate(async () => {
    job.status = "processing";
    console.log(`🚀 Queue ${id}: processing ${filePaths.length} files for job ${mongoJobId}`);

    try {
      await runBatchQueue(job, filePaths, mongoJobId, processFile);
    } catch (err: any) {
      console.error(`❌ Queue ${id} crashed:`, err.message);
      job.status = "error";
      job.error  = err.message;
      // Clean up any remaining files
      for (const fp of filePaths) cleanupFile(fp);
    }

    job.finishedAt = Date.now();
    if (job.status === "processing") job.status = "done";

    const elapsed = ((job.finishedAt - job.startedAt) / 1000).toFixed(1);
    console.log(`✅ Queue ${id} done: ${job.succeeded} new, ${job.duplicates} dups, ${job.failed} failed — ${elapsed}s`);
  });

  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core batch worker
// ─────────────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 8; // Files per Gemini call

async function runBatchQueue(
  job: QueueJob,
  filePaths: string[],
  mongoJobId: string,
  processFile: ProcessFileFn
): Promise<void> {
  // Lazy import to avoid circular dependencies
  const Applicant = (await import("../models/Applicant.model")).default;
  const Job       = (await import("../models/Job.model")).default;

  // Step 1: Extract text from all files in parallel (fast, no API calls)
  const extracted: { filePath: string; filename: string; text: string }[] = [];

  await Promise.allSettled(
    filePaths.map(async (fp) => {
      const text = await extractText(fp);
      extracted.push({ filePath: fp, filename: path.basename(fp), text });
    })
  );

  // Maintain original order for result mapping
  extracted.sort((a, b) =>
    filePaths.indexOf(a.filePath) - filePaths.indexOf(b.filePath)
  );

  // Step 2: Check for multi-person PDFs first (single file with multiple CVs)
  // If a PDF's text has 2+ email addresses we try multi-person parsing
  const multiPersonResults = new Map<string, any[]>(); // filePath → [profiles]
  const singleFiles: { filePath: string; filename: string; text: string }[] = [];

  for (const item of extracted) {
    const ext = path.extname(item.filePath).toLowerCase();
    if (ext === ".pdf" && item.text.trim().length > 200) {
      const emailCount = (item.text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g) || []).length;
      if (emailCount >= 2) {
        // Likely multi-person PDF — try Gemini multi-person parse
        console.log(`📋 Multi-person PDF detected: ${item.filename} (${emailCount} emails found)`);
        const profiles = await parseMultiPersonPDF(item.text, item.filename);
        if (profiles.length > 1) {
          // Success — save each profile
          multiPersonResults.set(item.filePath, profiles);
          cleanupFile(item.filePath);

          for (let pi = 0; pi < profiles.length; pi++) {
            const profile = profiles[pi];
            try {
              const { applicant, isNew } = await linkApplicantToMongo(
                Applicant, Job, profile, mongoJobId
              );
              const result: FileResult = {
                fileName:      `${item.filename} (person ${pi + 1}/${profiles.length})`,
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
              job.results.push(result);
              if (isNew) job.succeeded++;
              else        job.duplicates++;
            } catch (err: any) {
              job.results.push({
                fileName: `${item.filename} (person ${pi + 1})`,
                candidateName: "Parse error", email: "", headline: "",
                location: "", skillsCount: 0, expCount: 0, projectCount: 0,
                eduCount: 0, certCount: 0, isExisting: false,
                error: err.message,
              });
              job.failed++;
            }
          }
          job.done++;
          continue;
        }
        // Gemini didn't find multiple people — treat as single
        console.log(`  → Gemini found only 1 person in ${item.filename}, treating as single`);
      }
    }
    singleFiles.push(item);
  }

  // Step 3: Batch parse remaining single-person files
  // Send in groups of BATCH_SIZE to Gemini
  const batches: typeof singleFiles[] = [];
  for (let i = 0; i < singleFiles.length; i += BATCH_SIZE) {
    batches.push(singleFiles.slice(i, i + BATCH_SIZE));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    console.log(`📦 Queue batch ${bi + 1}/${batches.length}: ${batch.length} files`);

    const inputs: ResumeInput[] = batch.map(item => ({
      text:     item.text,
      filename: item.filename,
    }));

    let profiles: any[];
    try {
      profiles = await batchParseResumes(inputs);
    } catch (err: any) {
      console.error(`❌ Batch ${bi + 1} failed, falling back to single-file:`, err.message);
      // Batch failed — fall back to single-file processing for this batch
      for (const item of batch) {
        try {
          const result = await processFile(item.filePath, mongoJobId);
          job.results.push(result);
          if (result.isExisting) job.duplicates++;
          else                   job.succeeded++;
        } catch (e: any) {
          job.results.push({
            fileName: item.filename, candidateName: item.filename,
            email: "", headline: "", location: "",
            skillsCount: 0, expCount: 0, projectCount: 0,
            eduCount: 0, certCount: 0, isExisting: false,
            error: e.message,
          });
          job.failed++;
          cleanupFile(item.filePath);
        }
        job.done++;
      }
      continue;
    }

    // Save each parsed profile to MongoDB
    for (let pi = 0; pi < batch.length; pi++) {
      const item    = batch[pi];
      const profile = profiles[pi];

      try {
        if (profile.error || (!profile.firstName && !profile.lastName && !profile.email)) {
          throw new Error("Empty or errored profile from Gemini");
        }

        // Attach the Cloudinary URL if possible (skip for batch — file may already be gone)
        const { applicant, isNew } = await linkApplicantToMongo(
          Applicant, Job, { ...profile, resumeUrl: "" }, mongoJobId
        );

        job.results.push({
          fileName:      item.filename,
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
        });

        if (isNew) job.succeeded++;
        else        job.duplicates++;
      } catch (err: any) {
        console.warn(`⚠️  Falling back to single-file parse for ${item.filename}: ${err.message}`);
        // Try the single-file processFile fallback
        try {
          const result = await processFile(item.filePath, mongoJobId);
          job.results.push(result);
          if (result.isExisting) job.duplicates++;
          else                   job.succeeded++;
          item.filePath = ""; // mark as handled (processFile deletes the file)
        } catch (e2: any) {
          job.results.push({
            fileName: item.filename, candidateName: item.filename,
            email: "", headline: "", location: "",
            skillsCount: 0, expCount: 0, projectCount: 0,
            eduCount: 0, certCount: 0, isExisting: false,
            error: e2.message,
          });
          job.failed++;
        }
      }

      // Clean up the temp file if not already handled by processFile
      if (item.filePath) cleanupFile(item.filePath);
      job.done++;
    }

    // Gap between Gemini batch calls
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: save/link applicant to MongoDB (used by both multi-person + batch paths)
// ─────────────────────────────────────────────────────────────────────────────
async function linkApplicantToMongo(
  Applicant: any,
  Job: any,
  profile: any,
  jobId: string
): Promise<{ applicant: any; isNew: boolean }> {
  if (!profile.email || profile.email.trim() === "") {
    const fallback = `candidate.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@review.pending`;
    profile = { ...profile, email: fallback, _emailMissing: true };
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
    email:  profile.email.toLowerCase().trim(),
    jobIds: [jobId],
  });
  await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
  return { applicant, isNew: true };
}