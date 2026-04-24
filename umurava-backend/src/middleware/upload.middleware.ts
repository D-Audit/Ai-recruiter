// umurava-backend/src/middleware/upload.middleware.ts
// Fixed:
//   - diskStorage destination now auto-creates the uploads/ directory if it doesn't exist
//   - resumeFileFilter accepts all common resume types
//   - Sizes increased slightly to handle larger PDFs/DOCX

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists at startup (prevents ENOENT on first deploy)
const UPLOADS_DIR = "uploads/";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    // Sanitise original name before using it in the filename
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

// ── CSV / XLSX filter (for csv + xlsx upload routes) ──────────────────────
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [".csv", ".pdf", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV, PDF and Excel files allowed"), false);
  }
};

// ── Resume filter (PDF + DOCX + DOC + TXT + ODT) ─────────────────────────
const resumeFileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [".pdf", ".docx", ".doc", ".txt", ".odt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type "${ext}" is not allowed. Please upload a PDF, DOCX, DOC, TXT, or ODT file.`
      ),
      false
    );
  }
};

// ── Original export — used by csv/xlsx/pdf routes ─────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB — generous for PDF uploads
    files:    20,                // max 20 files per request
  },
});

// ── Resume export — used by /upload/resume route ──────────────────────────
export const resumeUpload = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB — DOCX with embedded images can be large
    files:    20,                // max 20 files per request (batch resume uploads)
  },
});