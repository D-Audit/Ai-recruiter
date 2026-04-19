import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import applicantRoutes from "./routes/applicant.routes";
import screeningRoutes from "./routes/screening.routes";
import chatRoutes from "./routes/chat.routes";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import crypto from "crypto";

dotenv.config();
console.log(crypto.randomBytes(256).toString("hex"));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://your-app.vercel.app"]
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Try again later.",
  },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests. Please slow down.",
  },
});

app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/screening", aiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/screening", screeningRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Umurava AI Backend is running ✅" });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

connectDB().then(() => {
 app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});