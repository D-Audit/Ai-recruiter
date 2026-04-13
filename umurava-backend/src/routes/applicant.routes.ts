import { Router } from "express";
import { upload, resumeUpload } from "../middleware/upload.middleware";
import {
  getApplicants,
  getUmuravaProfiles,
  uploadCSV,
  uploadPDF,
  uploadXLSX,
  selectUmuravaProfiles,
  uploadResume,
  uploadFromURL,
  submitManualApplicant,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// All applicant routes require authentication
router.use(protect);

// Platform profiles
router.get("/umurava", getUmuravaProfiles);

// Job-specific applicants
router.get("/:jobId", getApplicants);

// File & URL Uploads
router.post("/upload/csv", upload.single("file"), uploadCSV);
router.post("/upload/pdf", upload.single("file"), uploadPDF);
router.post("/upload/xlsx", upload.single("file"), uploadXLSX);
router.post("/upload/resume", resumeUpload.single("file"), uploadResume);
router.post("/upload/url", uploadFromURL);

// Manual applicant entry (called by frontend applicants page)
router.post("/manual", submitManualApplicant);

// Umurava profile selection
router.post("/select", selectUmuravaProfiles);

export default router;