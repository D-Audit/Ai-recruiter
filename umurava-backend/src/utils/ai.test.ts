import dotenv from "dotenv";
dotenv.config();

import { screenCandidates, compareCandidates, testGeminiConnection } from "../services/ai.service";
import { JobInput, ApplicantInput } from "../types/index";

// ─────────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────────

const testJob: JobInput = {
  id: "job_test_001",
  title: "Senior React Developer",
  description:
    "We need an experienced React developer to build our recruitment platform frontend.",
  requiredSkills: ["React", "TypeScript", "Node.js", "MongoDB"],
  yearsOfExperience: 3,
  educationLevel: "Bachelor",
  location: "Kigali, Rwanda",
};

const testApplicants: ApplicantInput[] = [
  {
    id: "app_001",
    fullName: "Alice Uwimana",
    email: "alice@email.com",
    skills: ["React", "TypeScript", "Node.js", "MongoDB"],
    yearsOfExperience: 4,
    education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda",
    languages: ["English", "Kinyarwanda"],
    pastProjects: [
      {
        title: "E-commerce App",
        description: "Full stack shopping platform",
        techUsed: ["React", "Node.js", "MongoDB"],
      },
    ],
    source: "umurava",
  },
  {
    id: "app_002",
    fullName: "Bob Mutabazi",
    email: "bob@email.com",
    skills: ["Python", "Django", "PostgreSQL"],
    yearsOfExperience: 5,
    education: "Master in Software Engineering",
    location: "Kigali, Rwanda",
    languages: ["English"],
    pastProjects: [
      {
        title: "Bank API",
        description: "REST API for banking transactions",
        techUsed: ["Python", "Django"],
      },
    ],
    source: "umurava",
  },
  {
    id: "app_003",
    fullName: "Carol Ingabire",
    email: "carol@email.com",
    skills: ["React", "CSS", "JavaScript", "Figma"],
    yearsOfExperience: 2,
    education: "Bachelor in IT",
    location: "Musanze, Rwanda",
    languages: ["English", "Kinyarwanda"],
    pastProjects: [],
    source: "umurava",
  },
  {
    id: "app_004",
    fullName: "David Nkurunziza",
    email: "david@email.com",
    skills: ["React", "TypeScript", "Node.js", "AWS", "MongoDB"],
    yearsOfExperience: 6,
    education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda",
    languages: ["English", "Kinyarwanda", "French"],
    pastProjects: [
      {
        title: "Logistics Platform",
        description: "Delivery tracking system",
        techUsed: ["React", "Node.js", "AWS"],
      },
    ],
    source: "umurava",
  },
  {
    id: "app_005",
    fullName: "Eva Mukamana",
    email: "eva@email.com",
    skills: ["Vue.js", "Laravel", "MySQL"],
    yearsOfExperience: 3,
    education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda",
    languages: ["English", "Kinyarwanda"],
    pastProjects: [
      {
        title: "School App",
        description: "School management system",
        techUsed: ["Vue.js", "Laravel"],
      },
    ],
    source: "external",
  },
];

// ─────────────────────────────────────────────
// RUN ALL TESTS
// ─────────────────────────────────────────────

async function runAllTests() {
  console.log("═══════════════════════════════════════");
  console.log("   UMURAVA AI SYSTEM — RUNNING TESTS   ");
  console.log("═══════════════════════════════════════\n");

  // ── TEST 1: Gemini Connection ──
  console.log("TEST 1: Gemini API Connection");
  console.log("─────────────────────────────");
  try {
    const connected = await testGeminiConnection();
    if (connected) {
      console.log("✅ PASSED — Gemini is connected and working\n");
    } else {
      console.log("❌ FAILED — Gemini connection returned false\n");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ FAILED — Error:", error);
    process.exit(1);
  }

  // ── TEST 2: Candidate Screening ──
  console.log("TEST 2: AI Candidate Screening");
  console.log("─────────────────────────────");
  try {
    const results = await screenCandidates(testJob, testApplicants);

    console.log("✅ PASSED — Screening completed");
    console.log(`   Total applicants sent: ${results.totalApplicants}`);
    console.log(`   Candidates shortlisted: ${results.shortlistedCount}`);
    console.log(`   Top candidate: ${results.rankedCandidates[0]?.candidateId}`);
    console.log(`   Top score: ${results.rankedCandidates[0]?.score}/100`);
    console.log("\n   Full Ranked Results:");

    results.rankedCandidates.forEach((c) => {
      console.log(`   #${c.rank} — ID: ${c.candidateId} | Score: ${c.score}/100`);
      console.log(`        Strengths: ${c.strengths.substring(0, 80)}...`);
      console.log(`        Gaps: ${c.gaps.substring(0, 80)}...`);
      console.log(`        Skills Matched: ${c.skillsMatched?.join(", ")}`);
      console.log(`        Skills Missing: ${c.skillsMissing?.join(", ")}`);
      console.log("");
    });

    console.log(`   Bias Notice: ${results.biasNotice}\n`);

  } catch (error) {
    console.log("❌ FAILED — Error:", error);
  }

  // ── TEST 3: Candidate Comparison ──
  console.log("TEST 3: Candidate Comparison");
  console.log("─────────────────────────────");
  try {
    const candidatesToCompare = testApplicants.slice(0, 2);
    const comparison = await compareCandidates(testJob, candidatesToCompare);

    console.log("✅ PASSED — Comparison completed");
    console.log(`   Winner: ${comparison.winner}`);
    console.log(`   Reason: ${comparison.winnerReason}`);
    console.log("\n   Comparison Details:");
    comparison.comparison?.forEach((c: any) => {
      console.log(`   ${c.fullName} — Score: ${c.score} | Verdict: ${c.verdict}`);
      console.log(`   Strength: ${c.topStrength}`);
      console.log(`   Gap: ${c.biggestGap}\n`);
    });

  } catch (error) {
    console.log("❌ FAILED — Error:", error);
  }

  // ── TEST 4: Edge Case — Empty Skills ──
  console.log("TEST 4: Edge Case — Applicant With No Skills");
  console.log("─────────────────────────────────────────────");
  try {
    const edgeCaseApplicants: ApplicantInput[] = [
      {
        id: "app_edge_001",
        fullName: "Empty Skills Person",
        email: "empty@email.com",
        skills: [],
        yearsOfExperience: 0,
        education: "",
        location: "",
        languages: [],
        pastProjects: [],
        source: "external",
      },
      {
        id: "app_edge_002",
        fullName: "Good Candidate",
        email: "good@email.com",
        skills: ["React", "TypeScript"],
        yearsOfExperience: 3,
        education: "Bachelor",
        location: "Kigali",
        languages: ["English"],
        pastProjects: [],
        source: "umurava",
      },
    ];

    const edgeResults = await screenCandidates(testJob, edgeCaseApplicants);
    console.log("✅ PASSED — Edge case handled correctly");
    console.log(`   Results returned: ${edgeResults.shortlistedCount} candidates\n`);

  } catch (error) {
    console.log("❌ FAILED — Error:", error);
  }

  // ── SUMMARY ──
  console.log("═══════════════════════════════════════");
  console.log("         ALL TESTS COMPLETED           ");
  console.log("═══════════════════════════════════════");
}

runAllTests().catch((error) => {
  console.error("❌ Test runner crashed:", error);
  process.exit(1);
});