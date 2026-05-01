

import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt", ".odt"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB per file inside the zip

export type ExtractedFile = {
  filePath:     string;   
  originalName: string;   
  sizeBytes:    number;
};

export type ZipExtractResult = {
  files:    ExtractedFile[];
  skipped:  { name: string; reason: string }[];
  total:    number;
};

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

   
    if (entry.isDirectory) continue;

    
    if (entryName.includes("__MACOSX") || baseName.startsWith(".")) {
      skipped.push({ name: entryName, reason: "System file" });
      continue;
    }

  
    const ext = path.extname(baseName).toLowerCase();
    if (ext === ".zip") {
      skipped.push({ name: entryName, reason: "Nested ZIP not supported" });
      continue;
    }

    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      skipped.push({ name: entryName, reason: `File type ${ext} not supported` });
      continue;
    }

    
    const data = entry.getData();
    if (data.length > MAX_FILE_SIZE_BYTES) {
      skipped.push({ name: entryName, reason: `File too large (${(data.length / 1024 / 1024).toFixed(1)} MB — max 20 MB)` });
      continue;
    }

    
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