import { Router } from "express";
import { createJob, getAllJobs, getJob, updateJob, deleteJob } from "../controllers/job.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.post("/", createJob);
router.get("/", getAllJobs);
router.get("/:id", getJob);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;