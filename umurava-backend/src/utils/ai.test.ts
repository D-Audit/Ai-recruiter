import dotenv from "dotenv";
dotenv.config();

import { screenCandidates, compareCandidates, testGeminiConnection } from "../services/ai.service";
import { JobInput, ApplicantInput } from "../types/index";

const testJob: JobInput = {
  id: "job_test_001",
  title: "Senior React Developer",
  description: "We need an experienced React developer to build our platform",
  requiredSkills: ["React", "TypeScript", "Node.js", "MongoDB"],
  yearsOfExperience: 3,
  educationLevel: "Bachelor",
  location: "Kigali, Rwanda",
};

const testApplicants: ApplicantInput[] = [
  {
    id: "app_001",
    firstName: "Alice",
    lastName: "Uwimana",
    email: "alice@email.com",
    headline: "Senior Full Stack Engineer",
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
    ],
    experience: [
      {
        company: "Tech Solutions Rwanda",
        role: "Full Stack Developer",
        startDate: "2021-01",
        endDate: "Present",
        description: "Built web applications for clients",
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
    certifications: [],
    projects: [
      {
        name: "E-commerce App",
        description: "Full stack shopping platform",
        technologies: ["React", "Node.js"],
        role: "Full Stack Developer",
      },
    ],
    availability: { status: "Available", type: "Full-time" },
    source: "umurava",
  },
  {
    id: "app_002",
    firstName: "Bob",
    lastName: "Mutabazi",
    email: "bob@email.com",
    headline: "Backend Engineer — Python",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Python", level: "Expert", yearsOfExperience: 5 },
      { name: "Django", level: "Advanced", yearsOfExperience: 4 },
      { name: "PostgreSQL", level: "Advanced", yearsOfExperience: 4 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
    ],
    experience: [
      {
        company: "Andela",
        role: "Backend Engineer",
        startDate: "2020-03",
        endDate: "Present",
        description: "Built REST APIs",
        technologies: ["Python", "Django"],
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
    projects: [],
    availability: { status: "Available", type: "Full-time" },
    source: "umurava",
  },
  {
    id: "app_003",
    firstName: "Carol",
    lastName: "Ingabire",
    email: "carol@email.com",
    headline: "Frontend Developer",
    location: "Musanze, Rwanda",
    skills: [
      { name: "React", level: "Advanced", yearsOfExperience: 2 },
      { name: "CSS", level: "Expert", yearsOfExperience: 3 },
      { name: "JavaScript", level: "Advanced", yearsOfExperience: 3 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [],
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
    availability: { status: "Available", type: "Full-time" },
    source: "umurava",
  },
  {
    id: "app_004",
    firstName: "David",
    lastName: "Nkurunziza",
    email: "david@email.com",
    headline: "Senior Backend Engineer",
    location: "Kigali, Rwanda",
    skills: [
      { name: "React", level: "Expert", yearsOfExperience: 6 },
      { name: "TypeScript", level: "Expert", yearsOfExperience: 4 },
      { name: "Node.js", level: "Expert", yearsOfExperience: 6 },
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
        description: "Led backend development",
        technologies: ["Node.js", "TypeScript", "AWS"],
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
      { name: "AWS Solutions Architect", issuer: "Amazon", issueDate: "2021-03" },
    ],
    projects: [],
    availability: { status: "Open to Opportunities", type: "Full-time" },
    source: "umurava",
  },
  {
    id: "app_005",
    firstName: "Eva",
    lastName: "Mukamana",
    email: "eva@email.com",
    headline: "Mobile Developer",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Vue.js", level: "Advanced", yearsOfExperience: 3 },
      { name: "Laravel", level: "Advanced", yearsOfExperience: 3 },
      { name: "MySQL", level: "Intermediate", yearsOfExperience: 2 },
    ],
    languages: [
      { name: "English", proficiency: "Fluent" },
      { name: "Kinyarwanda", proficiency: "Native" },
    ],
    experience: [],
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
    projects: [],
    availability: { status: "Available", type: "Full-time" },
    source: "external",
  },
];

async function runAllTests() {
  console.log("═══════════════════════════════════════");
  console.log("   UMURAVA AI SYSTEM — RUNNING TESTS   ");
  console.log("═══════════════════════════════════════\n");

  // TEST 1: Gemini Connection
  console.log("TEST 1: Gemini API Connection");
  console.log("─────────────────────────────");
  try {
    const connected = await testGeminiConnection();
    if (connected) {
      console.log("✅ PASSED — Gemini is connected\n");
    } else {
      console.log("❌ FAILED\n");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ FAILED:", error);
    process.exit(1);
  }

  // TEST 2: Screening
  console.log("TEST 2: AI Candidate Screening");
  console.log("─────────────────────────────");
  try {
    const results = await screenCandidates(testJob, testApplicants);
    console.log("✅ PASSED");
    console.log(`   Total: ${results.totalApplicants}`);
    console.log(`   Shortlisted: ${results.shortlistedCount}`);
    console.log(`   Top candidate: ${results.rankedCandidates[0]?.candidateId}`);
    console.log(`   Top score: ${results.rankedCandidates[0]?.score}/100\n`);

    results.rankedCandidates.forEach((c) => {
      console.log(`   #${c.rank} ID:${c.candidateId} Score:${c.score} Confidence:${c.confidence}`);
    });
    console.log("");
  } catch (error) {
    console.log("❌ FAILED:", error);
  }

  // TEST 3: Comparison
  console.log("TEST 3: Candidate Comparison");
  console.log("─────────────────────────────");
  try {
    const comparison = await compareCandidates(
      testJob,
      testApplicants.slice(0, 2)
    );
    console.log("✅ PASSED");
    console.log(`   Winner: ${comparison.winner}`);
    console.log(`   Reason: ${comparison.winnerReason}\n`);
  } catch (error) {
    console.log("❌ FAILED:", error);
  }

  // TEST 4: Edge Case
  console.log("TEST 4: Edge Case — Empty Skills");
  console.log("─────────────────────────────────");
  try {
    const edgeCandidates: ApplicantInput[] = [
      {
        id: "edge_001",
        firstName: "Empty",
        lastName: "Person",
        email: "empty@email.com",
        headline: "",
        location: "",
        skills: [],
        languages: [],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        availability: { status: "Available", type: "Full-time" },
        source: "external",
      },
      {
        id: "edge_002",
        firstName: "Good",
        lastName: "Candidate",
        email: "good@email.com",
        headline: "React Developer",
        location: "Kigali",
        skills: [
          { name: "React", level: "Advanced", yearsOfExperience: 3 },
          { name: "TypeScript", level: "Intermediate", yearsOfExperience: 2 },
        ],
        languages: [{ name: "English", proficiency: "Fluent" }],
        experience: [],
        education: [
          {
            institution: "UR",
            degree: "Bachelor's",
            fieldOfStudy: "CS",
            startYear: 2019,
            endYear: 2023,
          },
        ],
        certifications: [],
        projects: [],
        availability: { status: "Available", type: "Full-time" },
        source: "umurava",
      },
    ];

    const edgeResults = await screenCandidates(testJob, edgeCandidates);
    console.log("✅ PASSED — Edge case handled");
    console.log(`   Results: ${edgeResults.shortlistedCount} candidates\n`);
  } catch (error) {
    console.log("❌ FAILED:", error);
  }

  console.log("═══════════════════════════════════════");
  console.log("         ALL TESTS COMPLETED           ");
  console.log("═══════════════════════════════════════");
}

runAllTests().catch((error) => {
  console.error("❌ Test runner crashed:", error);
  process.exit(1);
});