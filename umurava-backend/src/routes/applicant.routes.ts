// umurava-backend/src/routes/applicant.routes.ts
// Fixed:
//   - /upload/pdf now uses upload.array("file", 20) to support multiple PDFs
//   - /upload/resume now uses resumeUpload.array("file", 20) for multiple resumes

import { Router } from "express";
import { upload, resumeUpload } from "../middleware/upload.middleware";
import {
  getApplicants,
  getApplicantById,
  getUmuravaProfiles,
  uploadCSV,
  uploadPDF,
  uploadXLSX,
  selectUmuravaProfiles,
  uploadResume,
  uploadFromURL,
  submitManualApplicant,
  removeApplicantFromJob,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

// ── Platform profiles ──────────────────────────────────────────────────────
router.get("/umurava", getUmuravaProfiles);

// ── Single applicant by ID — MUST be before /:jobId so it is not swallowed ──
router.get("/profile/:id", getApplicantById);

// ── Job-specific applicants ────────────────────────────────────────────────
router.get("/:jobId", getApplicants);

// ── File & URL uploads ─────────────────────────────────────────────────────
// CSV — always single file
router.post("/upload/csv",  upload.single("file"),  uploadCSV);

// PDF — supports single OR multiple PDFs in one request
// Frontend sends one file at a time so upload.array still works (array of 1)
router.post("/upload/pdf",  upload.array("file", 20), uploadPDF);

// XLSX — always single file
router.post("/upload/xlsx", upload.single("file"),  uploadXLSX);

// Resume (PDF/DOCX/DOC/TXT/ODT) — supports multiple files per request
router.post("/upload/resume", resumeUpload.array("file", 20), uploadResume);

// URL import — no file, body only
router.post("/upload/url", uploadFromURL);

// ── Manual applicant entry ─────────────────────────────────────────────────
router.post("/manual", submitManualApplicant);

// ── Umurava profile selection ──────────────────────────────────────────────
router.post("/select", selectUmuravaProfiles);

// ── Remove applicant from a specific job ──────────────────────────────────
router.delete("/:jobId/applicant/:applicantId", removeApplicantFromJob);

export default router;