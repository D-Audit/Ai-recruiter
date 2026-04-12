import { Router } from "express";
import { register, login, getMe, changePassword } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import User from "../models/User.model";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/password", protect, changePassword);

// Update current user profile
router.put("/me", protect, async (req: any, res: any) => {
  try {
    const { name, company } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(company !== undefined && { company }) },
      { new: true, select: "-password" }
    );
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;