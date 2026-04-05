import { Router } from "express";
import {
  getApplicants, getUmuravaProfiles,
  uploadCSV, uploadPDF, selectUmuravaProfiles,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.use(protect);
router.get("/umurava", getUmuravaProfiles);
router.get("/:jobId", getApplicants);
router.post("/upload/csv", upload.single("file"), uploadCSV);
router.post("/upload/pdf", upload.single("file"), uploadPDF);
router.post("/select", selectUmuravaProfiles);

export default router;