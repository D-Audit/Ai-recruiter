import fs from "fs";
import csv from "csv-parser";

const VALID_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const VALID_PROFICIENCIES = ["Basic", "Conversational", "Fluent", "Native"];

// ── Parse skills — supports multiple formats:
//   "React|Node.js|Python"                     → all Intermediate, 0 years
//   "React:Expert|Node.js:Intermediate"         → with levels
//   "React:Expert:3|Node.js:Intermediate:2"     → with levels and years per skill
//   "React,Node.js,Python"                      → old comma format (still works)
function parseSkills(raw: string, fallbackYears: number): { name: string; level: string; yearsOfExperience: number }[] {
  if (!raw.trim()) return [];
  const separator = raw.includes("|") ? "|" : ",";
  return raw
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(":").map((p) => p.trim());
      const name  = parts[0] || "";
      const level = VALID_LEVELS.includes(parts[1]) ? parts[1] : "Intermediate";
      const years = parts[2] ? parseInt(parts[2]) || 0 : fallbackYears;
      return { name, level, yearsOfExperience: years };
    })
    .filter((s) => s.name);
}

// ── Parse languages — supports:
//   "English:Fluent|French:Basic"  or  "English,French"
function parseLanguages(raw: string): { name: string; proficiency: string }[] {
  if (!raw.trim()) return [{ name: "English", proficiency: "Fluent" }];
  const separator = raw.includes("|") ? "|" : ",";
  const parsed = raw
    .split(separator)
    .map((l) => {
      const parts       = l.trim().split(":");
      const name        = parts[0]?.trim() || "";
      const proficiency = VALID_PROFICIENCIES.includes(parts[1]?.trim()) ? parts[1].trim() : "Fluent";
      return { name, proficiency };
    })
    .filter((l) => l.name);
  return parsed.length > 0 ? parsed : [{ name: "English", proficiency: "Fluent" }];
}

export async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // ── Skills: uses pipe-separated format with optional level and years per skill
        const rawSkills     = (row.skills || row.Skills || "").toString();
        const fallbackYears = parseInt(row.yearsOfExperience || row.years_experience || row.experience || "0") || 0;
        const skills        = parseSkills(rawSkills, fallbackYears);

        // ── Languages: uses pipe-separated format with optional proficiency
        const rawLangs  = (row.languages || row.Languages || "").toString();
        const languages = parseLanguages(rawLangs);

        // ── Build education array
        const eduDegree = (row.educationDegree || row.education_degree || row.degree || "").toString();
        const eduField  = (row.educationField  || row.education_field  || row.fieldOfStudy || "").toString();
        const education = (eduDegree || eduField)
          ? [{ institution: "", degree: eduDegree, fieldOfStudy: eduField, startYear: 0, endYear: 0 }]
          : [];

        // ── Handle both "name" (single field) and "firstName"/"lastName" columns
        const firstName = (row.firstName || row.first_name || (row.name || "").split(" ")[0] || "").toString().trim();
        const lastName  = (row.lastName  || row.last_name  || (row.name || "").split(" ").slice(1).join(" ") || "").toString().trim();
        const email     = (row.email || row.Email || "").toString().trim();

        // Only include rows with at least name and email
        if ((firstName || lastName) && email) {
          results.push({
            firstName,
            lastName,
            email,
            headline:  (row.headline  || row.Headline  || "").toString(),
            bio:       (row.bio       || row.Bio       || "").toString(),
            location:  (row.location  || row.Location  || "").toString(),
            skills,
            languages,
            experience:     [],
            education,
            certifications: [],
            projects:       [],
            availability: {
              status:    "Available",
              type:      (row.availabilityType || "Full-time").toString(),
              startDate: "",
            },
            socialLinks: {
              linkedin:  (row.linkedin  || "").toString(),
              github:    (row.github    || "").toString(),
              portfolio: (row.portfolio || "").toString(),
            },
            source: "external",
          });
        }
      })
      .on("end", () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        resolve(results);
      })
      .on("error", (error) => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        reject(error);
      });
  });
}