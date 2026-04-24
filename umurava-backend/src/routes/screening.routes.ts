// umurava-backend/src/routes/screening.routes.ts
import { Router } from "express";
import {
  runScreening,
  getScreeningResults,
  compareApplicants,
  getAllScreenings,
} from "../controllers/screening.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.post("/run/:jobId",    runScreening);
router.get("/results/:jobId", getScreeningResults);
router.post("/compare",       compareApplicants);
router.get("/all",            getAllScreenings);

export default router;