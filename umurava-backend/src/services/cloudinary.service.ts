// umurava-backend/src/services/cloudinary.service.ts
// Fixed: retry logic, proper file cleanup, better error reporting

const { v2: cloudinary } = require("cloudinary");
import fs from "fs";

// Configure once on import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a resume file to Cloudinary with retry logic.
 * Returns the secure URL, or "" if Cloudinary is not configured.
 * The local temp file is cleaned up after upload (success OR failure).
 */
export async function uploadResumeToCloud(
  filePath: string,
  originalName: string,
  retries = 3
): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("⚠️  Cloudinary not fully configured — skipping cloud upload");
    // Still clean up the local file
    cleanupLocalFile(filePath);
    return "";
  }

  const safeName = originalName
    .replace(/\.[^.]+$/, "")           // remove extension
    .replace(/[^a-zA-Z0-9\-_]/g, "_")  // sanitise
    .slice(0, 60);

  const publicId = `umurava/resumes/${safeName}_${Date.now()}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        public_id:     publicId,
        resource_type: "raw",  // PDFs and docs are raw files, not images
        overwrite:     false,
        use_filename:  false,
      });

      console.log(`☁️  Uploaded to Cloudinary: ${result.secure_url}`);
      cleanupLocalFile(filePath);
      return result.secure_url;

    } catch (error: any) {
      const isRetryable =
        error.message?.includes("503") ||
        error.message?.includes("502") ||
        error.message?.includes("ETIMEDOUT") ||
        error.message?.includes("ECONNRESET") ||
        error.http_code >= 500;

      if (isRetryable && attempt < retries) {
        const backoff = attempt * 1500;
        console.warn(`⚠️  Cloudinary attempt ${attempt}/${retries} failed — retrying in ${backoff}ms:`, error.message);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      console.error(`❌ Cloudinary upload failed after ${attempt} attempt(s):`, error.message);
      cleanupLocalFile(filePath);
      return ""; // Non-fatal — applicant still gets saved, just without a resume URL
    }
  }

  cleanupLocalFile(filePath);
  return "";
}

function cleanupLocalFile(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* non-fatal */ }
  }
}