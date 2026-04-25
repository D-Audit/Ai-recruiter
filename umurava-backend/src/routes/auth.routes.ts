// umurava-backend/src/routes/auth.routes.ts

import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/register",  register);
router.post("/login",     login);
router.post("/google",    googleLogin);       // Google OAuth — no auth needed
router.get( "/me",        protect, getMe);
router.put( "/profile",   protect, updateProfile);
router.put( "/password",  protect, changePassword); // ✅ was missing — used by settings page

export default router;