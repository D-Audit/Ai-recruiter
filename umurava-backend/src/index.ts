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
// FIX 1: The Vercel deployment URL must be whitelisted here AND in
//         Google Cloud Console → Authorised JavaScript Origins.
//
// Add every URL your frontend runs on.  Trailing slashes break matching —
// never include them.  The regex catches preview deployments like
// umurava-xyz-team.vercel.app automatically.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "http://localhost:3000",
  "http://localhost:3001",
  // ✅ Replace this with your EXACT Vercel production URL (no trailing slash):
  "https://ai-umurava.vercel.app",
  // Catches all Vercel preview URLs for your project automatically:
  /^https:\/\/.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and whitelisted origins
      if (!origin) return callback(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      if (allowed) return callback(null, true);
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // Explicitly handle pre-flight on every route
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle OPTIONS pre-flight for all routes
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// ─────────────────────────────────────────────────────────────────────────────
// Helmet
// FIX 2: Default helmet blocks the Google GSI script and iframe.
//         We must explicitly allow accounts.google.com in CSP.
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
        frameSrc:    ["'self'", "https://accounts.google.com"],
        connectSrc:  ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com"],
        imgSrc:      ["'self'", "data:", "https://lh3.googleusercontent.com"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Required for Google popup
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiters
// ─────────────────────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,                    // raised from 100 — Vercel cold-starts can spike
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                     // raised from 10 — Google sign-in can hit this fast
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

app.use("/api/",             globalLimiter);
app.use("/api/auth/login",   authLimiter);
app.use("/api/auth/google",  authLimiter);   // FIX 3: rate-limit Google endpoint too
app.use("/api/screening",    aiLimiter);

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