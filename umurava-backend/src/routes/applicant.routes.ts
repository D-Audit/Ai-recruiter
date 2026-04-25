// umurava-backend/src/routes/applicant.routes.ts

import { Router } from "express";
import { upload, resumeUpload } from "../middleware/upload.middleware";
import {
  getApplicants,
  getApplicantById,
  getUmuravaProfiles,
  uploadCSV,
  uploadResume,
  uploadFromURL,
  submitManualApplicant,
  removeApplicantFromJob,
  selectUmuravaProfiles,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

// ── Platform profiles ──────────────────────────────────────────────────────
router.get("/umurava", getUmuravaProfiles);

// ── Single applicant by ID — MUST be before /:jobId ───────────────────────
router.get("/profile/:id", getApplicantById);

// ── Job-specific applicants ────────────────────────────────────────────────
router.get("/:jobId", getApplicants);

// ── File & URL uploads ─────────────────────────────────────────────────────

// CSV — single file
router.post("/upload/csv",  upload.single("file"), uploadCSV);

// PDF — uploadResume handles PDF, DOCX, DOC, TXT (single or multiple)
router.post("/upload/pdf",  resumeUpload.array("file", 20), uploadResume);

// XLSX — uploadCSV already parses XLSX/XLS via the same csv.service
router.post("/upload/xlsx", upload.single("file"), uploadCSV);

// Resume (PDF/DOCX/DOC/TXT) — multiple files per request
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