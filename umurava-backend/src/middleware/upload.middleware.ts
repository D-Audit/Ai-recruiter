// src/middleware/upload.middleware.ts
// UPDATED — now also allows .docx .doc .txt .odt for the /upload/resume route
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Original filter — CSV, PDF, XLSX only (kept for csv/xlsx routes)
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [".csv", ".pdf", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV, PDF and Excel files allowed"), false);
  }
};

// NEW filter — for /upload/resume route: PDF + DOCX + DOC + TXT + ODT
const resumeFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [".pdf", ".docx", ".doc", ".txt", ".odt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, DOC, TXT or ODT files are allowed for resume upload"), false);
  }
};

// Original export — unchanged, used by csv/xlsx/pdf routes
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// NEW export — used only by /upload/resume route
export const resumeUpload = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB (DOCX can be larger)
});