// umurava-backend/src/services/pdf.service.ts
//
// ✅ FIXED: pdf-parse v2.x — import correctly using .default
//
// Fixed:
//   - Block temp files are cleaned up after successful parse (not just on error)
//   - Uses skipCloudinary=true for temp block files (Cloudinary handled by controller)
//   - Better error handling per block

import fs from "fs";
import { parseResumeFile } from "./resume.service";

/**
 * Parse a single PDF resume file.
 * Delegates to resume.service which handles text extraction + Gemini + Cloudinary.
 */
export async function parsePDFResume(filePath: string): Promise<any> {
  return parseResumeFile(filePath);
}

/**
 * Parse a multi-resume PDF (multiple CVs concatenated in one file).
 * Splits by email boundaries, parses each segment individually.
 */
export async function parseMultiPDFResume(filePath: string): Promise<any[]> {
  const blockTmps: string[] = [];

  try {
    // ✅ FIX: pdf-parse v2.x changed its export — use .default
    const pdfParseModule = require("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;

    const buffer = fs.readFileSync(filePath);
    const data   = await pdfParse(buffer);
    const text: string = data.text || "";

    // Clean up the original PDF now (Cloudinary already handled by controller)
    cleanupFile(filePath);

    if (!text.trim()) {
      console.warn("⚠️ PDF appears to be empty or scanned — no text could be extracted");
      return [];
    }

    // Detect email boundaries to split multi-resume PDFs
    const emailMatches: RegExpExecArray[] = [];
    const emailRe = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = emailRe.exec(text)) !== null) emailMatches.push(m);

    // Single resume (0 or 1 email) — parse the whole thing
    if (emailMatches.length <= 1) {
      const tmp = filePath + ".tmp.txt";
      blockTmps.push(tmp);
      fs.writeFileSync(tmp, text, "utf-8");
      const result = await parseResumeFile(tmp, /* skipCloudinary */ true);
      return [result];
    }

    // Multiple resumes — split by email boundaries
    const blocks: string[] = [];
    for (let i = 0; i < emailMatches.length; i++) {
      const start = Math.max(0, emailMatches[i].index - 400);
      const end   = i + 1 < emailMatches.length
        ? Math.max(0, emailMatches[i + 1].index - 400)
        : text.length;
      blocks.push(text.slice(start, end));
    }

    const results: any[] = [];
    for (const [idx, block] of blocks.entries()) {
      if (block.trim().length < 40) continue;

      const tmp = `${filePath}.block${idx}.txt`;
      blockTmps.push(tmp);

      try {
        fs.writeFileSync(tmp, block, "utf-8");
        // Skip Cloudinary for block temps — no meaningful file to store
        const parsed = await parseResumeFile(tmp, /* skipCloudinary */ true);
        if (parsed.email && !parsed.email.includes("resume.uploaded")) {
          results.push(parsed);
        }
      } catch (err) {
        console.warn(`⚠️ Block ${idx} parse failed:`, err);
      }
      // parseResumeFile (skipCloudinary=true) already calls cleanupFile(tmp)
      // but clean up defensively in case it throws early:
      cleanupFile(tmp);
    }

    return results;

  } catch (error) {
    console.error("❌ PDF multi-parse error:", error);
    cleanupFile(filePath);
    return [];
  } finally {
    // Ensure all block tmps are cleaned up regardless
    for (const tmp of blockTmps) {
      cleanupFile(tmp);
    }
  }
}

function cleanupFile(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}