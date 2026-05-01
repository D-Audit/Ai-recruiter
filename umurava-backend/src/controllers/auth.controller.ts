
import Mailer from 'nodemailer';
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.model";
import { OAuth2Client } from "google-auth-library";
import { send } from 'process';
import { sendResetLink } from '../utils/email';

const generateToken = (id: string, email: string, name: string): string => {
  return jwt.sign(
    { id, email, name },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
};

const getFrontendUrl = (): string => {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
};

const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM || "Umurava AI <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Reset your Umurava AI password",
      html: `
        <p>Hello,</p>
        <p>Use this secure link to reset your Umurava AI password. It expires in 15 minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Could not send reset email: ${text}`);
  }
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
// Uses google-auth-library to verify it server-side — avoids the "forbidden"
// errors that the tokeninfo HTTP endpoint sometimes returns.
// ─────────────────────────────────────────────────────────────────────────────
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential, company } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: "Google credential token is required" });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("❌ GOOGLE_CLIENT_ID is not set in environment variables");
      res.status(500).json({
        success: false,
        message: "Google sign-in is not configured on the server. Please contact support.",
      });
      return;
    }

    // ── Verify the ID token using google-auth-library ──────────────────────
    const oauthClient = new OAuth2Client(clientId);
    let googlePayload: any;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken:  credential,
        audience: clientId,
      });
      googlePayload = ticket.getPayload();
    } catch (verifyErr: any) {
      console.error("❌ Google token verification failed:", verifyErr.message);
      res.status(401).json({
        success: false,
        message: "Invalid or expired Google token. Please try signing in again.",
      });
      return;
    }

    if (!googlePayload || !googlePayload.email) {
      res.status(400).json({ success: false, message: "Could not retrieve email from Google account." });
      return;
    }

    const email = googlePayload.email.toLowerCase();
    const name  = googlePayload.name || email.split("@")[0];

    // Find existing user or create a new one
    let user = await User.findOne({ email });

    if (!user) {
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

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    if(!user){
      return res.status(400).json({message:"No user found with that email address" });
    }

  


    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${getFrontendUrl()}/reset-password/${resetToken}`;
    const options = {
      from: process.env.PASSWORD_RESET_FROM || "Umurava AI <support@umurava.com>",
      to: user.email,
      subject: "Reset your Umurava AI password",
      html: `
        <p>You have requested to reset your password for your Umurava AI account.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    };
    await sendResetLink(user.email, resetUrl, options);

    res.json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to request password reset" });
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = String(req.params.token || "");
    const { password } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: "Reset token is required" });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      return;
    }

    const user = await User.findOne({
      passwordResetToken: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to reset password" });
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
    await user.save();
    console.log(`✅ Password changed for user: ${user.email}`);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("❌ Change password error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to change password" });
  }
};
