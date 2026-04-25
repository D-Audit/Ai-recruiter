// umurava-backend/src/index.ts
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

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ai-umurava.vercel.app",
  /^https:\/\/.*\.vercel\.app$/,
  // If you have a custom domain add it here too, e.g.:
  // "https://www.umurava.ai",
];

// Handle pre-flight OPTIONS for every route BEFORE any other middleware
app.options("*", (req, res) => {
  const origin = req.headers.origin || "";
  const allowed = ALLOWED_ORIGINS.some((o) =>
    typeof o === "string" ? o === origin : o.test(origin)
  );
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.sendStatus(204);
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server / same origin
      const allowed = ALLOWED_ORIGINS.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      if (allowed) return callback(null, true);
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// ─────────────────────────────────────────────────────────────────────────────
// Helmet
//
// FIX: Default helmet() sets:
//   Cross-Origin-Opener-Policy: same-origin
//
// That header is what the screenshot shows causing "would block the
// window.postMessage call" — Google Sign-In uses a popup and postMessage
// to deliver the credential. We must set COOP to "same-origin-allow-popups".
//
// Also default CSP blocks accounts.google.com scripts from loading.
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    // CRITICAL: allow Google popup + postMessage
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
        frameSrc:    ["'self'", "https://accounts.google.com"],
        connectSrc:  ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://openidconnect.googleapis.com"],
        imgSrc:      ["'self'", "data:", "https://lh3.googleusercontent.com"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiters
// ─────────────────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please slow down." },
});

app.use("/api/",            globalLimiter);
app.use("/api/auth/login",  authLimiter);
app.use("/api/auth/google", authLimiter);
app.use("/api/screening",   aiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/jobs",       jobRoutes);
app.use("/api/applicants", applicantRoutes);
app.use("/api/screening",  screeningRoutes);
app.use("/api/chat",       chatRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Umurava AI Backend is running ✅" });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Global error:", err);
  res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

connectDB().then(() => {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});