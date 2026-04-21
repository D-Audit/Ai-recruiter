
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const profiles = [
  {
    firstName: "Alice", lastName: "Uwimana",
    email: "alice.uwimana@email.com",
    headline: "Senior Full Stack Engineer — React & Node.js",
    bio: "4+ years building production web apps for Rwanda's fintech and e-commerce sector.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "React",      level: "Expert",       yearsOfExperience: 4 },
      { name: "TypeScript", level: "Advanced",      yearsOfExperience: 3 },
      { name: "Node.js",    level: "Advanced",      yearsOfExperience: 4 },
      { name: "MongoDB",    level: "Intermediate",  yearsOfExperience: 2 },
      { name: "Next.js",    level: "Intermediate",  yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
      { name: "French", proficiency: "Conversational" },
    ],
    experience: [{
      company: "Tech Solutions Rwanda", role: "Full Stack Developer",
      startDate: "2021-01", endDate: "", isCurrent: true,
      description: "Built and maintained 3 production web apps serving 20K+ users.",
      technologies: ["React", "Node.js", "MongoDB", "TypeScript"],
    }],
    education: [{
      institution: "University of Rwanda", degree: "Bachelor's",
      fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021,
    }],
    certifications: [{ name: "AWS Certified Developer", issuer: "Amazon", issueDate: "2022-06" }],
    projects: [{
      name: "E-commerce Platform", description: "Full-stack shopping platform with M-Pesa integration",
      technologies: ["React","Node.js","MongoDB"], role: "Full Stack Developer",
      link: "https://github.com/alice/ecommerce", startDate: "2022-01", endDate: "2022-06",
    }],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "https://linkedin.com/in/alice", github: "https://github.com/alice", portfolio: "" },
    source: "umurava",
    jobIds: [],
  },
  {
    firstName: "Bob", lastName: "Mutabazi",
    email: "bob.mutabazi@email.com",
    headline: "Backend Engineer — Python & AI Systems",
    bio: "5 years in backend with focus on scalable APIs and ML pipelines.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Python",     level: "Expert",   yearsOfExperience: 5 },
      { name: "Django",     level: "Advanced", yearsOfExperience: 4 },
      { name: "PostgreSQL", level: "Advanced", yearsOfExperience: 4 },
      { name: "Docker",     level: "Intermediate", yearsOfExperience: 2 },
      { name: "FastAPI",    level: "Intermediate", yearsOfExperience: 1 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [{
      company: "Andela", role: "Backend Engineer",
      startDate: "2020-03", endDate: "", isCurrent: true,
      description: "Built REST APIs serving 100K+ daily requests.",
      technologies: ["Python","Django","PostgreSQL","Docker"],
    }],
    education: [{
      institution: "Carnegie Mellon University Africa", degree: "Master's",
      fieldOfStudy: "Software Engineering", startYear: 2018, endYear: 2020,
    }],
    certifications: [],
    projects: [{
      name: "Bank API System", description: "High-throughput REST API for banking",
      technologies: ["Python","Django","PostgreSQL"], role: "Backend Engineer",
      link: "", startDate: "2021-01", endDate: "2021-08",
    }],
    availability: { status: "Open to Opportunities", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "https://linkedin.com/in/bob", github: "https://github.com/bob", portfolio: "" },
    source: "umurava",
    jobIds: [],
  },
  {
    firstName: "Carol", lastName: "Ingabire",
    email: "carol.ingabire@email.com",
    headline: "Frontend Developer — React & UI/UX",
    bio: "Creative frontend dev who bridges design and code.",
    location: "Musanze, Rwanda",
    skills: [
      { name: "React",      level: "Advanced", yearsOfExperience: 2 },
      { name: "JavaScript", level: "Advanced", yearsOfExperience: 3 },
      { name: "CSS",        level: "Expert",   yearsOfExperience: 3 },
      { name: "Figma",      level: "Advanced", yearsOfExperience: 2 },
      { name: "Tailwind",   level: "Advanced", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [{
      company: "Creative Agency Kigali", role: "Frontend Developer",
      startDate: "2022-01", endDate: "", isCurrent: true,
      description: "Built responsive web interfaces for 10+ client projects.",
      technologies: ["React","CSS","Figma","Tailwind"],
    }],
    education: [{
      institution: "INES Ruhengeri", degree: "Bachelor's",
      fieldOfStudy: "Information Technology", startYear: 2018, endYear: 2022,
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "https://linkedin.com/in/carol", github: "https://github.com/carol", portfolio: "" },
    source: "umurava",
    jobIds: [],
  },
  {
    firstName: "David", lastName: "Nkurunziza",
    email: "david.nkurunziza@email.com",
    headline: "Senior Backend Engineer — Node.js & Cloud",
    bio: "6 years building cloud-native systems. Led backend for MTN mobile money.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Node.js",    level: "Expert",   yearsOfExperience: 6 },
      { name: "TypeScript", level: "Expert",   yearsOfExperience: 4 },
      { name: "AWS",        level: "Advanced", yearsOfExperience: 3 },
      { name: "MongoDB",    level: "Advanced", yearsOfExperience: 5 },
      { name: "Redis",      level: "Intermediate", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
      { name: "French", proficiency: "Fluent" },
    ],
    experience: [{
      company: "MTN Rwanda", role: "Senior Backend Engineer",
      startDate: "2019-06", endDate: "", isCurrent: true,
      description: "Led backend for mobile money platform (1M+ monthly transactions).",
      technologies: ["Node.js","TypeScript","AWS","MongoDB","Redis"],
    }],
    education: [{
      institution: "University of Rwanda", degree: "Bachelor's",
      fieldOfStudy: "Computer Science", startYear: 2015, endYear: 2019,
    }],
    certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon", issueDate: "2021-03" }],
    projects: [{
      name: "Mobile Money Platform v2", description: "Microservices rewrite of MTN payment system",
      technologies: ["Node.js","AWS","MongoDB","Redis"], role: "Tech Lead",
      link: "", startDate: "2020-01", endDate: "2021-12",
    }],
    availability: { status: "Open to Opportunities", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "https://linkedin.com/in/david", github: "https://github.com/david", portfolio: "" },
    source: "umurava",
    jobIds: [],
  },
  {
    firstName: "Eva", lastName: "Mukamana",
    email: "eva.mukamana@email.com",
    headline: "Mobile Developer — Flutter & React Native",
    bio: "Cross-platform mobile developer (200K+ users on production apps).",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Flutter",       level: "Expert",   yearsOfExperience: 3 },
      { name: "Dart",          level: "Expert",   yearsOfExperience: 3 },
      { name: "React Native",  level: "Advanced", yearsOfExperience: 2 },
      { name: "Firebase",      level: "Advanced", yearsOfExperience: 3 },
      { name: "TypeScript",    level: "Intermediate", yearsOfExperience: 1 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [{
      company: "Irembo", role: "Mobile Developer",
      startDate: "2021-04", endDate: "", isCurrent: true,
      description: "Built Irembo citizen services app with 200K+ downloads.",
      technologies: ["Flutter","Firebase","Dart"],
    }],
    education: [{
      institution: "University of Rwanda", degree: "Bachelor's",
      fieldOfStudy: "Computer Science", startYear: 2017, endYear: 2021,
    }],
    certifications: [],
    projects: [{
      name: "Government Services App", description: "Flutter app for Rwanda gov services",
      technologies: ["Flutter","Firebase"], role: "Lead Developer",
      link: "https://irembo.gov.rw", startDate: "2021-06", endDate: "2022-06",
    }],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "https://linkedin.com/in/eva", github: "https://github.com/eva", portfolio: "" },
    source: "umurava",
    jobIds: [],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("✅ Connected to MongoDB");

  // Remove existing platform pool profiles only
  const del = await mongoose.connection.collection("applicants").deleteMany({
    source: "umurava",
    jobIds: { $size: 0 },  // only delete those with no job assignments
  });
  console.log(`🗑  Removed ${del.deletedCount} old pool profiles`);

  await mongoose.connection.collection("applicants").insertMany(profiles);
  console.log(`✅ Seeded ${profiles.length} Umurava platform profiles`);

  process.exit(0);
}
seed().catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); });