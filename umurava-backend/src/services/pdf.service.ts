import fs from "fs";

export async function parsePDFResume(filePath: string): Promise<any> {
  try {
    // Dynamic import to avoid typescript issues with pdf-parse
    const pdfParse = require("pdf-parse");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Extract basic info from PDF text
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(\+?[\d\s()-]{7,15})/);

    // Extract skills (common tech keywords)
    const commonSkills = [
      "React", "Node.js", "TypeScript", "JavaScript", "Python",
      "Django", "MongoDB", "PostgreSQL", "MySQL", "Docker",
      "AWS", "Vue.js", "Angular", "Flutter", "GraphQL",
      "Express", "Next.js", "PHP", "Laravel", "Java",
      "Spring Boot", "Redis", "Firebase", "Tailwind",
    ];

    const foundSkills = commonSkills.filter((skill) =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    // Clean up file after reading
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      fullName: "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0].trim() : "",
      skills: foundSkills,
      yearsOfExperience: 0,
      education: "",
      location: "",
      languages: ["English"],
      resumeText: text,
      source: "external",
    };

  } catch (error) {
    // Clean up file if error happens
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`PDF parsing failed: ${error}`);
  }
}