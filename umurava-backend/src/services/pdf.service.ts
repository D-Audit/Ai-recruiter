// umurava-backend/src/services/pdf.service.ts
//
// PDF-specific parsing — delegates to resume.service.ts for the actual work.
// Kept as a separate file for backward compatibility (controller still imports
// parsePDFResume from here).
//
// ✅ ZERO Gemini calls during upload — works for any number of files.

import fs from "fs";
import { parseResumeFile } from "./resume.service";

/**
 * Parse a single PDF (or any resume file) → structured applicant profile.
 * Delegates entirely to resume.service.ts — no Gemini calls.
 */
export async function parsePDFResume(filePath: string): Promise<any> {
  // resume.service.ts handles text extraction, field parsing,
  // and temp-file cleanup internally.
  return parseResumeFile(filePath);
}

/**
 * Parse a PDF that might contain multiple resumes.
 * For the hackathon scope: treats each file as one resume.
 * Returns an array for API compatibility.
 */
export async function parseMultiPDFResume(filePath: string): Promise<any[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text: string = data.text || "";

    // Clean up temp file
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* non-fatal */ }

    if (!text.trim()) {
      console.warn("⚠️ PDF appears to be empty or scanned — no text could be extracted");
      return [];
    }

    // Detect multiple resumes by counting email addresses
    const emailMatches: RegExpExecArray[] = [];
    const emailRe = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = emailRe.exec(text)) !== null) emailMatches.push(m);

    if (emailMatches.length <= 1) {
      // Single resume — parse directly without Gemini
      const { buildProfileFromText } = await import("./resume.service") as any;
      if (typeof buildProfileFromText === "function") {
        return [buildProfileFromText(text, filePath)];
      }
      // Fallback if internal function not exported: use parseResumeFile logic
      const { parseResumeFile: prf } = await import("./resume.service");
      // Write temp file for parseResumeFile
      const tmp = filePath + ".tmp.txt";
      fs.writeFileSync(tmp, text, "utf-8");
      const result = await prf(tmp);
      return [result];
    }

    // Multiple emails detected — split text around each email and parse each block
    const blocks: string[] = [];
    for (let i = 0; i < emailMatches.length; i++) {
      const start = Math.max(0, emailMatches[i].index - 400);
      const end   = i + 1 < emailMatches.length
        ? Math.max(0, emailMatches[i + 1].index - 400)
        : text.length;
      blocks.push(text.slice(start, end));
    }

    // Parse each block using resume.service's text-based parser (no Gemini)
    const results: any[] = [];
    for (const block of blocks) {
      if (block.trim().length < 40) continue;
      const tmp = `${filePath}.block${results.length}.txt`;
      try {
        fs.writeFileSync(tmp, block, "utf-8");
        const { parseResumeFile: prf } = await import("./resume.service");
        const parsed = await prf(tmp);
        if (parsed.email && !parsed.email.includes("resume.uploaded")) {
          results.push(parsed);
        }
      } catch (err) {
        console.warn(`⚠️ Block ${results.length} parse failed:`, err);
        // Clean up tmp if parseResumeFile didn't
        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { /* noop */ }
      }
    }

    return results;
  } catch (error) {
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* noop */ }
    console.error("❌ PDF multi-parse error:", error);
    return [];
  }
}