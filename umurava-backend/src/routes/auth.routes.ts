// umurava-backend/src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, googleLogin, getMe, updateProfile } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);          // ← NEW: Google OAuth
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;