import fs from "fs";
import * as XLSX from "xlsx";

const VALID_LEVELS        = ["Beginner", "Intermediate", "Advanced", "Expert"];
const VALID_PROFICIENCIES = ["Basic", "Conversational", "Fluent", "Native"];

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

export async function parseXLSXFile(filePath: string): Promise<any[]> {
  try {
    const buffer   = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0];
    const sheet     = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const results: any[] = [];

    for (const row of rows) {
      const firstName = (row.firstName || row.first_name || (row.name || "").split(" ")[0] || "").toString().trim();
      const lastName  = (row.lastName  || row.last_name  || (row.name || "").split(" ").slice(1).join(" ") || "").toString().trim();
      const email     = (row.email || row.Email || "").toString().trim();

      if (!(firstName || lastName) || !email) continue;

      const rawSkills     = (row.skills || row.Skills || "").toString();
      const fallbackYears = parseInt(row.yearsOfExperience || row.years_experience || row.experience || "0") || 0;
      const skills        = parseSkills(rawSkills, fallbackYears);

      const rawLangs  = (row.languages || row.Languages || "").toString();
      const languages = parseLanguages(rawLangs);

      const eduDegree = (row.educationDegree || row.education_degree || row.degree || "").toString();
      const eduField  = (row.educationField  || row.education_field  || row.fieldOfStudy || "").toString();
      const education = (eduDegree || eduField)
        ? [{ institution: "", degree: eduDegree, fieldOfStudy: eduField, startYear: 0, endYear: 0 }]
        : [];

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

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return results;
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(`XLSX parsing failed: ${error}`);
  }
}