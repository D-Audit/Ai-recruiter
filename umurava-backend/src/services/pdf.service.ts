
import fs from "fs";
import { parseResumeFile } from "./resume.service";

export async function parsePDFResume(filePath: string): Promise<any> {
  return parseResumeFile(filePath);
}

export async function parseMultiPDFResume(filePath: string): Promise<any[]> {
  try {
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text: string = data.text || "";

   
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* non-fatal */ }

    if (!text.trim()) {
      console.warn("⚠️ PDF appears to be empty or scanned — no text could be extracted");
      return [];
    }

    const emailMatches: RegExpExecArray[] = [];
    const emailRe = /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g;
    let m: RegExpExecArray | null;
    while ((m = emailRe.exec(text)) !== null) emailMatches.push(m);

    if (emailMatches.length <= 1) {
      const { buildProfileFromText } = await import("./resume.service") as any;
      if (typeof buildProfileFromText === "function") {
        return [buildProfileFromText(text, filePath)];
      }
      const { parseResumeFile: prf } = await import("./resume.service");
      const tmp = filePath + ".tmp.txt";
      fs.writeFileSync(tmp, text, "utf-8");
      const result = await prf(tmp);
      return [result];
    }

    const blocks: string[] = [];
    for (let i = 0; i < emailMatches.length; i++) {
      const start = Math.max(0, emailMatches[i].index - 400);
      const end   = i + 1 < emailMatches.length
        ? Math.max(0, emailMatches[i + 1].index - 400)
        : text.length;
      blocks.push(text.slice(start, end));
    }

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