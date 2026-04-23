/* eslint-disable @typescript-eslint/no-var-requires */
const { v2: cloudinary } = require("cloudinary");
import fs from "fs";

// Configure once on import
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadResumeToCloud(
  filePath: string,
  originalName: string
): Promise<string> {
 
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn("⚠️  Cloudinary not configured — skipping cloud upload");
    return "";
  }

  try {
    const safeName = originalName
      .replace(/\.[^.]+$/, "")           
      .replace(/[^a-zA-Z0-9-_]/g, "_")  
      .slice(0, 60);                     

    const publicId = `umurava/resumes/${safeName}_${Date.now()}`;

    const result = await cloudinary.uploader.upload(filePath, {
      public_id:     publicId,
      resource_type: "raw",    
    });

    console.log(`☁️  Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;

  } catch (error: any) {
    console.error("❌ Cloudinary upload failed:", error.message);
    return ""; 
  }
}