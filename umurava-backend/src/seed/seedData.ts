import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const fakeProfiles = [
  {
    firstName: "Alice",
    lastName: "Uwimana",
    email: "alice@email.com",
    headline: "Senior Full Stack Engineer — React & Node.js",
    bio: "Experienced full stack developer with 4 years building web applications",
    location: "Kigali, Rwanda",
    skills: [
      { name: "React", level: "Expert", yearsOfExperience: 4 },
      { name: "TypeScript", level: "Advanced", yearsOfExperience: 3 },
      { name: "Node.js", level: "Advanced", yearsOfExperience: 4 },
      { name: "MongoDB", level: "Intermediate", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
      { name: "French", proficiency: "Conversational" },
    ],
    experience: [
      {
        company: "Tech Solutions Rwanda",
        role: "Full Stack Developer",
        startDate: "2021-01",
        endDate: "Present",
        description: "Built and maintained web applications for clients",
        technologies: ["React", "Node.js", "MongoDB"],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: "University of Rwanda",
        degree: "Bachelor's",
        fieldOfStudy: "Computer Science",
        startYear: 2017,
        endYear: 2021,
      },
    ],
    certifications: [
      {
        name: "AWS Certified Developer",
        issuer: "Amazon",
        issueDate: "2022-06",
      },
    ],
    projects: [
      {
        name: "E-commerce Platform",
        description: "Full stack shopping platform with payment integration",
        technologies: ["React", "Node.js", "MongoDB"],
        role: "Full Stack Developer",
        link: "https://github.com/alice/ecommerce",
        startDate: "2022-01",
        endDate: "2022-06",
      },
    ],
    availability: {
      status: "Available",
      type: "Full-time",
      startDate: "2024-01-01",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/alice",
      github: "https://github.com/alice",
      portfolio: "https://alice.dev",
    },
    source: "umurava",
   
  },
  {
    firstName: "Bob",
    lastName: "Mutabazi",
    email: "bob@email.com",
    headline: "Backend Engineer — Python & AI Systems",
    bio: "Backend engineer specializing in Python and machine learning systems",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Python", level: "Expert", yearsOfExperience: 5 },
      { name: "Django", level: "Advanced", yearsOfExperience: 4 },
      { name: "PostgreSQL", level: "Advanced", yearsOfExperience: 4 },
      { name: "Docker", level: "Intermediate", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [
      {
        company: "Andela",
        role: "Backend Engineer",
        startDate: "2020-03",
        endDate: "Present",
        description: "Built REST APIs and data pipelines",
        technologies: ["Python", "Django", "PostgreSQL"],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: "Carnegie Mellon University Africa",
        degree: "Master's",
        fieldOfStudy: "Software Engineering",
        startYear: 2018,
        endYear: 2020,
      },
    ],
    certifications: [],
    projects: [
      {
        name: "Bank API System",
        description: "REST API for banking transactions",
        technologies: ["Python", "Django", "PostgreSQL"],
        role: "Backend Engineer",
        link: "https://github.com/bob/bankapi",
        startDate: "2021-01",
        endDate: "2021-08",
      },
    ],
    availability: {
      status: "Open to Opportunities",
      type: "Full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/bob",
      github: "https://github.com/bob",
      portfolio: "",
    },
    source: "umurava",

  },
  {
    firstName: "Carol",
    lastName: "Ingabire",
    email: "carol@email.com",
    headline: "Frontend Developer — React & UI/UX",
    bio: "Creative frontend developer with strong design skills",
    location: "Musanze, Rwanda",
    skills: [
      { name: "React", level: "Advanced", yearsOfExperience: 2 },
      { name: "JavaScript", level: "Advanced", yearsOfExperience: 3 },
      { name: "CSS", level: "Expert", yearsOfExperience: 3 },
      { name: "Figma", level: "Advanced", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [
      {
        company: "Creative Agency Kigali",
        role: "Frontend Developer",
        startDate: "2022-01",
        endDate: "Present",
        description: "Built responsive web interfaces for clients",
        technologies: ["React", "CSS", "Figma"],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: "INES Ruhengeri",
        degree: "Bachelor's",
        fieldOfStudy: "Information Technology",
        startYear: 2018,
        endYear: 2022,
      },
    ],
    certifications: [],
    projects: [],
    availability: {
      status: "Available",
      type: "Full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/carol",
      github: "https://github.com/carol",
      portfolio: "",
    },
    source: "umurava",

  },
  {
    firstName: "David",
    lastName: "Nkurunziza",
    email: "david@email.com",
    headline: "Senior Backend Engineer — Node.js & Cloud",
    bio: "Senior engineer with expertise in cloud architecture and microservices",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Node.js", level: "Expert", yearsOfExperience: 6 },
      { name: "TypeScript", level: "Expert", yearsOfExperience: 4 },
      { name: "AWS", level: "Advanced", yearsOfExperience: 3 },
      { name: "MongoDB", level: "Advanced", yearsOfExperience: 5 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
      { name: "French", proficiency: "Fluent" },
    ],
    experience: [
      {
        company: "MTN Rwanda",
        role: "Senior Backend Engineer",
        startDate: "2019-06",
        endDate: "Present",
        description: "Led backend development for mobile money platform",
        technologies: ["Node.js", "TypeScript", "AWS", "MongoDB"],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: "University of Rwanda",
        degree: "Bachelor's",
        fieldOfStudy: "Computer Science",
        startYear: 2015,
        endYear: 2019,
      },
    ],
    certifications: [
      {
        name: "AWS Solutions Architect",
        issuer: "Amazon",
        issueDate: "2021-03",
      },
    ],
    projects: [
      {
        name: "Mobile Money Platform",
        description: "Scalable payment processing system",
        technologies: ["Node.js", "AWS", "MongoDB"],
        role: "Tech Lead",
        link: "",
        startDate: "2020-01",
        endDate: "2021-12",
      },
    ],
    availability: {
      status: "Open to Opportunities",
      type: "Full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/david",
      github: "https://github.com/david",
      portfolio: "",
    },
    source: "umurava",

  },
  {
    firstName: "Eva",
    lastName: "Mukamana",
    email: "eva@email.com",
    headline: "Mobile Developer — Flutter & React Native",
    bio: "Mobile developer passionate about cross-platform applications",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Flutter", level: "Expert", yearsOfExperience: 3 },
      { name: "Dart", level: "Expert", yearsOfExperience: 3 },
      { name: "React Native", level: "Advanced", yearsOfExperience: 2 },
      { name: "Firebase", level: "Advanced", yearsOfExperience: 3 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [
      {
        company: "Irembo",
        role: "Mobile Developer",
        startDate: "2021-04",
        endDate: "Present",
        description: "Built government services mobile app",
        technologies: ["Flutter", "Firebase"],
        isCurrent: true,
      },
    ],
    education: [
      {
        institution: "University of Rwanda",
        degree: "Bachelor's",
        fieldOfStudy: "Computer Science",
        startYear: 2017,
        endYear: 2021,
      },
    ],
    certifications: [],
    projects: [
      {
        name: "Government Services App",
        description: "Flutter app for accessing government services",
        technologies: ["Flutter", "Firebase"],
        role: "Lead Developer",
        link: "https://irembo.gov.rw",
        startDate: "2021-06",
        endDate: "2022-06",
      },
    ],
    availability: {
      status: "Available",
      type: "Full-time",
      startDate: "",
    },
    socialLinks: {
      linkedin: "https://linkedin.com/in/eva",
      github: "https://github.com/eva",
      portfolio: "",
    },
    source: "umurava",

  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("✅ Connected to MongoDB");
  await mongoose.connection.collection("applicants").deleteMany({
    source: "umurava",
  });
  await mongoose.connection.collection("applicants").insertMany(fakeProfiles);
  console.log(`✅ Seeded ${fakeProfiles.length} profiles`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});