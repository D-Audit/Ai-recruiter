// umurava-backend/src/controllers/auth.controller.ts

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.model";

const generateToken = (id: string, email: string, name: string): string => {
  return jwt.sign(
    { id, email, name },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "Name, email and password are required" });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: "An account with this email already exists" });
      return;
    }

    const user  = await User.create({ name, email: email.toLowerCase(), password, company: company || "" });
    const token = generateToken(String(user._id), user.email, user.name);

    res.status(201).json({
      success: true,
      token,
      user: { id: String(user._id), name: user.name, email: user.email, company: user.company },
    });
  } catch (error: any) {
    console.error("❌ Register error:", error);
    res.status(500).json({ success: false, message: error.message || "Registration failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = generateToken(String(user._id), user.email, user.name);

    res.json({
      success: true,
      token,
      user: { id: String(user._id), name: user.name, email: user.email, company: user.company },
    });
  } catch (error: any) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: error.message || "Login failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// Accepts a Google ID token from the frontend (Google Sign-In SDK).
// Verifies it with Google's tokeninfo endpoint, finds or creates the user,
// returns our own JWT — same shape as email login.
// ─────────────────────────────────────────────────────────────────────────────
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, company } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: "Google credential token is required" });
      return;
    }

    // Verify the Google ID token against Google's public endpoint
    let googlePayload: any;
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
      );
      if (!response.ok) {
        res.status(401).json({ success: false, message: "Invalid Google token. Please try again." });
        return;
      }
      googlePayload = await response.json();
    } catch {
      res.status(401).json({ success: false, message: "Failed to verify Google token. Please try again." });
      return;
    }

    // Validate the token audience matches our app
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && googlePayload.aud !== clientId) {
      res.status(401).json({ success: false, message: "Google token audience mismatch." });
      return;
    }

    if (!googlePayload.email) {
      res.status(400).json({ success: false, message: "Could not retrieve email from Google account." });
      return;
    }

    const email = googlePayload.email.toLowerCase();
    const name  = googlePayload.name || googlePayload.email.split("@")[0];

    // Find existing user or create a new one
    let user = await User.findOne({ email });

    if (!user) {
      // Google users get a random password they can never use directly
      const randomPassword = crypto.randomBytes(32).toString("hex");
      user = await User.create({
        name,
        email,
        password: randomPassword,
        company: company || "",
      });
      console.log(`✅ New user created via Google: ${email}`);
    } else {
      console.log(`✅ Existing user signed in via Google: ${email}`);
    }

    const token = generateToken(String(user._id), user.email, user.name);

    res.json({
      success: true,
      token,
      user: { id: String(user._id), name: user.name, email: user.email, company: user.company },
    });
  } catch (error: any) {
    console.error("❌ Google login error:", error);
    res.status(500).json({ success: false, message: error.message || "Google login failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.json({
      success: true,
      user: { id: String(user._id), name: user.name, email: user.email, company: user.company },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, company } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, company },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: { id: String(user._id), name: user.name, email: user.email, company: user.company },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/password
// Used by settings/page.tsx to change password
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req: any, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Current and new password are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({ success: false, message: "Current password is incorrect" });
      return;
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hash in User model
    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("❌ Change password error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to change password" });
  }
};