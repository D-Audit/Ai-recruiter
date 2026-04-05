import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fakeProfiles = [
  {
    fullName: "Alice Uwimana", email: "alice@email.com",
    skills: ["React", "TypeScript", "Node.js", "MongoDB"],
    yearsOfExperience: 4, education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda", languages: ["English", "Kinyarwanda", "French"],
    pastProjects: [{ title: "E-commerce App", description: "Full stack app", techUsed: ["React", "Node.js"] }],
    source: "umurava", jobId: new mongoose.Types.ObjectId("69d13ec5c96a0d2318d7a74b"),
  },
  {
    fullName: "Bob Mutabazi", email: "bob@email.com",
    skills: ["Python", "Django", "PostgreSQL", "Docker"],
    yearsOfExperience: 5, education: "Master in Software Engineering",
    location: "Kigali, Rwanda", languages: ["English", "Kinyarwanda"],
    pastProjects: [{ title: "Bank API", description: "REST API for banking", techUsed: ["Python", "Django"] }],
    source: "umurava", jobId: new mongoose.Types.ObjectId("69d13ec5c96a0d2318d7a74b"),
  },
  {
    fullName: "Carol Ingabire", email: "carol@email.com",
    skills: ["React", "CSS", "JavaScript", "Figma"],
    yearsOfExperience: 2, education: "Bachelor in IT",
    location: "Musanze, Rwanda", languages: ["English", "Kinyarwanda"],
    pastProjects: [], source: "umurava", jobId: new mongoose.Types.ObjectId("69d13ec5c96a0d2318d7a74b"),
  },
  {
    fullName: "David Nkurunziza", email: "david@email.com",
    skills: ["Node.js", "Express", "MongoDB", "TypeScript", "AWS"],
    yearsOfExperience: 6, education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda", languages: ["English", "Kinyarwanda", "French"],
    pastProjects: [{ title: "Logistics Platform", description: "Delivery tracking", techUsed: ["Node.js", "AWS"] }],
    source: "umurava", jobId: new mongoose.Types.ObjectId("69d13ec5c96a0d2318d7a74b"),
  },
  {
    fullName: "Eva Mukamana", email: "eva@email.com",
    skills: ["Flutter", "Dart", "Firebase", "React Native"],
    yearsOfExperience: 3, education: "Bachelor in Computer Science",
    location: "Kigali, Rwanda", languages: ["English", "Kinyarwanda"],
    pastProjects: [{ title: "Mobile Banking App", description: "Cross platform app", techUsed: ["Flutter", "Firebase"] }],
    source: "umurava", jobId: new mongoose.Types.ObjectId("69d13ec5c96a0d2318d7a74b"),
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("✅ Connected");
  await mongoose.connection.collection("applicants").deleteMany({ source: "umurava" });
  await mongoose.connection.collection("applicants").insertMany(fakeProfiles);
  console.log(`✅ Seeded ${fakeProfiles.length} profiles`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });