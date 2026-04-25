// umurava-backend/src/services/zip.service.ts
//
// Extracts resume files from a ZIP archive.
// Filters to only PDF, DOCX, DOC, TXT — skips __MACOSX junk, hidden files,
// nested ZIPs, and anything that isn't a resume.
//
// Install: npm install adm-zip @types/adm-zip
// (adm-zip has zero native dependencies — works perfectly on Railway)

import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".odt"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB per file inside the zip

export type ExtractedFile = {
  filePath:     string;   // absolute path to extracted temp file
  originalName: string;   // original filename from inside the ZIP
  sizeBytes:    number;
};

export type ZipExtractResult = {
  files:    ExtractedFile[];
  skipped:  { name: string; reason: string }[];
  total:    number;
};

/**
 * Extracts all valid resume files from a ZIP archive into the uploads/ temp dir.
 * Returns paths to the extracted files plus a list of anything skipped and why.
 */
export async function extractZip(
  zipPath: string,
  outputDir: string = "uploads/"
): Promise<ZipExtractResult> {
  const zip     = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const files:   ExtractedFile[]                     = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const entry of entries) {
    const entryName = entry.entryName;
    const baseName  = entry.name;

    // Skip directories
    if (entry.isDirectory) continue;

    // Skip macOS metadata garbage
    if (entryName.includes("__MACOSX") || baseName.startsWith(".")) {
      skipped.push({ name: entryName, reason: "System file" });
      continue;
    }

    // Skip nested ZIPs
    const ext = path.extname(baseName).toLowerCase();
    if (ext === ".zip") {
      skipped.push({ name: entryName, reason: "Nested ZIP not supported" });
      continue;
    }

    // Only allow resume file types
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      skipped.push({ name: entryName, reason: `File type ${ext} not supported` });
      continue;
    }

    // Check uncompressed size
    const data = entry.getData();
    if (data.length > MAX_FILE_SIZE_BYTES) {
      skipped.push({ name: entryName, reason: `File too large (${(data.length / 1024 / 1024).toFixed(1)} MB — max 20 MB)` });
      continue;
    }

    // Write to temp directory
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outPath  = path.join(outputDir, `${Date.now()}-zip-${safeName}`);

    fs.writeFileSync(outPath, data);

    files.push({
      filePath:     outPath,
      originalName: baseName,
      sizeBytes:    data.length,
    });
  }

  return { files, skipped, total: entries.filter(e => !e.isDirectory).length };
}