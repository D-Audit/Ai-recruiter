// umurava-backend/src/routes/applicant.routes.ts

import { Router } from "express";
import { upload, resumeUpload, zipUpload } from "../middleware/upload.middleware";
import {
  getApplicants,
  getApplicantById,
  getUmuravaProfiles,
  uploadCSV,
  uploadResume,
  uploadZip,
  uploadFromURL,
  submitManualApplicant,
  removeApplicantFromJob,
  selectUmuravaProfiles,
  getQueueStatus,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();
router.use(protect);

// ── Platform profiles ──────────────────────────────────────────────────────
router.get("/umurava", getUmuravaProfiles);

// ── Queue status polling — frontend polls this for batch upload progress ──
router.get("/queue/:queueId", getQueueStatus);

// ── Single applicant by ID — MUST be before /:jobId ───────────────────────
router.get("/profile/:id", getApplicantById);

// ── Job-specific applicants ────────────────────────────────────────────────
router.get("/:jobId", getApplicants);

// ── CSV / XLSX uploads ─────────────────────────────────────────────────────
router.post("/upload/csv",  upload.single("file"), uploadCSV);
router.post("/upload/xlsx", upload.single("file"), uploadCSV);

// ── Resume uploads (single or multiple PDFs/DOCXs) ────────────────────────
// Uses array() to accept 1–20 files — single file still works
router.post("/upload/resume", resumeUpload.array("file", 20), uploadResume);
router.post("/upload/pdf",    resumeUpload.array("file", 20), uploadResume);

// ── ZIP bulk upload ────────────────────────────────────────────────────────
router.post("/upload/zip", zipUpload.single("file"), uploadZip);

// ── URL import ─────────────────────────────────────────────────────────────
router.post("/upload/url", uploadFromURL);

// ── Manual entry ───────────────────────────────────────────────────────────
router.post("/manual", submitManualApplicant);

// ── Umurava profile selection ──────────────────────────────────────────────
router.post("/select", selectUmuravaProfiles);

// ── Remove applicant from job ──────────────────────────────────────────────
router.delete("/:jobId/applicant/:applicantId", removeApplicantFromJob);

export default router;