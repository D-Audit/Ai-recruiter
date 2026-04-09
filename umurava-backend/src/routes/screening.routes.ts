import { Router } from "express";
import {
  runScreening, getResults, compareSelectedCandidates,
} from "../controllers/screening.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);
router.post("/run/:jobId", runScreening);
router.get("/results/:jobId", getResults);
router.post("/compare", compareSelectedCandidates);

export default router;