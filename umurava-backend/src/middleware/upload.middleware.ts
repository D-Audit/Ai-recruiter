// umurava-backend/src/middleware/upload.middleware.ts

import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = "uploads/";
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

// CSV / XLSX filter
const fileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  [".csv", ".pdf", ".xlsx"].includes(ext)
    ? cb(null, true)
    : cb(new Error("Only CSV, PDF and Excel files allowed"), false);
};

// Resume filter — PDF, DOCX, DOC, TXT, ODT
const resumeFileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  [".pdf", ".docx", ".doc", ".txt", ".odt"].includes(ext)
    ? cb(null, true)
    : cb(new Error(`File type "${ext}" is not allowed. Upload PDF, DOCX, DOC, TXT or ODT.`), false);
};

// ZIP filter
const zipFileFilter = (_req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  const ok = ext === ".zip" ||
    mime === "application/zip" ||
    mime === "application/x-zip-compressed" ||
    mime === "application/octet-stream";
  ok
    ? cb(null, true)
    : cb(new Error("Only ZIP files are allowed for bulk upload"), false);
};

// Standard uploader (CSV/XLSX)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
});

// Resume uploader (PDF/DOCX etc.)
export const resumeUpload = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
});

// ZIP uploader — up to 200 MB for large batches
export const zipUpload = multer({
  storage,
  fileFilter: zipFileFilter,
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
});