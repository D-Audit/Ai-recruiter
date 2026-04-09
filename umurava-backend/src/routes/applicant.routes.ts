import { Router } from "express";
import {
  getApplicants,
  getUmuravaProfiles,
  uploadCSV,
  uploadPDF,
  selectUmuravaProfiles,
} from "../controllers/applicant.controller";
import { protect } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import Applicant from "../models/Applicant.model";  // ← ADD THIS
import Job from "../models/Job.model";               // ← ADD THIS

const router = Router();

router.use(protect);
router.get("/umurava", getUmuravaProfiles);
router.get("/:jobId", getApplicants);
router.post("/upload/csv", upload.single("file"), uploadCSV);
router.post("/upload/pdf", upload.single("file"), uploadPDF);
router.post("/select", selectUmuravaProfiles);
router.post("/manual", protect, async (req: any, res: any) => {
  try {
    const applicant = await Applicant.create(req.body);
    await Job.findByIdAndUpdate(req.body.jobId, {
      $inc: { applicantsCount: 1 },
    });
    res.status(201).json({ success: true, applicant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;