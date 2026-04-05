import fs from "fs";
import csv from "csv-parser";

export async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Map CSV columns to our schema
        const mapped = {
          fullName: row.fullName || row.full_name || row.name || "",
          email: row.email || row.Email || "",
          phone: row.phone || row.Phone || "",
          skills: row.skills
            ? row.skills.split(",").map((s: string) => s.trim())
            : [],
          yearsOfExperience: parseInt(
            row.yearsOfExperience || row.years_experience || "0"
          ),
          education: row.education || row.Education || "",
          location: row.location || row.Location || "",
          languages: row.languages
            ? row.languages.split(",").map((l: string) => l.trim())
            : ["English"],
          source: "external",
        };
        results.push(mapped);
      })
      .on("end", () => {
        // Remove file after reading
        fs.unlinkSync(filePath);
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}