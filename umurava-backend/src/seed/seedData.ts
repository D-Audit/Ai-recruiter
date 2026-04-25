
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


const profiles = [
  {
    firstName: "Frank",
    lastName: "Habimana",
    email: "frank.habimana@email.com",
    headline: "Frontend Engineer — React & Next.js",
    bio: "3+ years building responsive web apps.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "React", level: "Advanced", yearsOfExperience: 3 },
      { name: "Next.js", level: "Advanced", yearsOfExperience: 2 },
      { name: "TypeScript", level: "Intermediate", yearsOfExperience: 2 }
    ],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "FinTech Africa",
      role: "Frontend Engineer",
      startDate: "2022-01",
      endDate: "",
      isCurrent: true,
      description: "Built dashboards.",
      technologies: ["React","Next.js"]
    }],
    education: [{
      institution: "University of Rwanda",
      degree: "Bachelor's",
      fieldOfStudy: "Computer Science",
      startYear: 2017,
      endYear: 2021
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: {
      linkedin: "https://linkedin.com/in/frank",
      github: "https://github.com/frank",
      portfolio: ""
    },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Grace",
    lastName: "Mukeshimana",
    email: "grace@email.com",
    headline: "UI/UX Designer",
    bio: "Creative product designer.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Figma", level: "Expert", yearsOfExperience: 4 },
      { name: "UI Design", level: "Advanced", yearsOfExperience: 3 }
    ],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Creative Labs",
      role: "Designer",
      startDate: "2021-01",
      endDate: "",
      isCurrent: true,
      description: "Designed SaaS products.",
      technologies: ["Figma"]
    }],
    education: [{
      institution: "Kepler",
      degree: "Bachelor's",
      fieldOfStudy: "Design",
      startYear: 2016,
      endYear: 2020
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Contract", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Henry",
    lastName: "Ndayisaba",
    email: "henry@email.com",
    headline: "DevOps Engineer",
    bio: "Cloud automation specialist.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "AWS", level: "Advanced", yearsOfExperience: 4 },
      { name: "Docker", level: "Expert", yearsOfExperience: 4 }
    ],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Cloud Rwanda",
      role: "DevOps Engineer",
      startDate: "2020-01",
      endDate: "",
      isCurrent: true,
      description: "Built CI/CD systems.",
      technologies: ["AWS","Docker"]
    }],
    education: [{
      institution: "CMU Africa",
      degree: "Master's",
      fieldOfStudy: "IT",
      startYear: 2018,
      endYear: 2020
    }],
    certifications: [],
    projects: [],
    availability: { status: "Open to Opportunities", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Irene",
    lastName: "Umutoni",
    email: "irene@email.com",
    headline: "HR Manager",
    bio: "Talent acquisition leader.",
    location: "Kigali, Rwanda",
    skills: [
      { name: "Recruitment", level: "Expert", yearsOfExperience: 6 }
    ],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Talent Hub",
      role: "HR Manager",
      startDate: "2019-01",
      endDate: "",
      isCurrent: true,
      description: "Managed hiring pipelines.",
      technologies: ["HRIS"]
    }],
    education: [{
      institution: "University of Rwanda",
      degree: "Bachelor's",
      fieldOfStudy: "HR",
      startYear: 2013,
      endYear: 2017
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "James",
    lastName: "Mugisha",
    email: "james@email.com",
    headline: "Data Analyst",
    bio: "Turns data into insights.",
    location: "Kampala, Uganda",
    skills: [
      { name: "SQL", level: "Expert", yearsOfExperience: 5 },
      { name: "Power BI", level: "Advanced", yearsOfExperience: 4 }
    ],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Insight Africa",
      role: "Data Analyst",
      startDate: "2020-05",
      endDate: "",
      isCurrent: true,
      description: "Built dashboards.",
      technologies: ["SQL","Power BI"]
    }],
    education: [{
      institution: "Makerere University",
      degree: "Bachelor's",
      fieldOfStudy: "Statistics",
      startYear: 2014,
      endYear: 2018
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Kevin",
    lastName: "Rwema",
    email: "kevin@email.com",
    headline: "Backend Engineer",
    bio: "API specialist.",
    location: "Kigali, Rwanda",
    skills: [{ name: "Node.js", level: "Advanced", yearsOfExperience: 4 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Tech Hub",
      role: "Backend Engineer",
      startDate: "2021-01",
      endDate: "",
      isCurrent: true,
      description: "Built APIs.",
      technologies: ["Node.js"]
    }],
    education: [{
      institution: "UR",
      degree: "Bachelor's",
      fieldOfStudy: "CS",
      startYear: 2016,
      endYear: 2020
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Linda",
    lastName: "Achieng",
    email: "linda@email.com",
    headline: "Marketing Manager",
    bio: "Growth strategist.",
    location: "Nairobi, Kenya",
    skills: [{ name: "SEO", level: "Advanced", yearsOfExperience: 5 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Brand Co",
      role: "Marketing Manager",
      startDate: "2019-02",
      endDate: "",
      isCurrent: true,
      description: "Scaled campaigns.",
      technologies: ["SEO"]
    }],
    education: [{
      institution: "UON",
      degree: "Bachelor's",
      fieldOfStudy: "Marketing",
      startYear: 2013,
      endYear: 2017
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Michael",
    lastName: "Kato",
    email: "michael@email.com",
    headline: "Mobile Developer",
    bio: "Flutter specialist.",
    location: "Kampala, Uganda",
    skills: [{ name: "Flutter", level: "Advanced", yearsOfExperience: 3 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "App House",
      role: "Mobile Developer",
      startDate: "2021-04",
      endDate: "",
      isCurrent: true,
      description: "Built mobile apps.",
      technologies: ["Flutter"]
    }],
    education: [{
      institution: "Makerere",
      degree: "Bachelor's",
      fieldOfStudy: "IT",
      startYear: 2016,
      endYear: 2020
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Nadia",
    lastName: "Bello",
    email: "nadia@email.com",
    headline: "Accountant",
    bio: "Finance operations expert.",
    location: "Lagos, Nigeria",
    skills: [{ name: "QuickBooks", level: "Advanced", yearsOfExperience: 4 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Finance Pro",
      role: "Accountant",
      startDate: "2020-01",
      endDate: "",
      isCurrent: true,
      description: "Managed accounts.",
      technologies: ["QuickBooks"]
    }],
    education: [{
      institution: "UNILAG",
      degree: "Bachelor's",
      fieldOfStudy: "Accounting",
      startYear: 2014,
      endYear: 2018
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Oliver",
    lastName: "Mensah",
    email: "oliver@email.com",
    headline: "Cybersecurity Analyst",
    bio: "Security monitoring expert.",
    location: "Accra, Ghana",
    skills: [{ name: "Cybersecurity", level: "Advanced", yearsOfExperience: 5 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "SecureNet",
      role: "Security Analyst",
      startDate: "2019-06",
      endDate: "",
      isCurrent: true,
      description: "Protected enterprise systems.",
      technologies: ["SIEM"]
    }],
    education: [{
      institution: "UG",
      degree: "Bachelor's",
      fieldOfStudy: "Cybersecurity",
      startYear: 2013,
      endYear: 2017
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Patience",
    lastName: "Mwangi",
    email: "patience@email.com",
    headline: "Sales Executive",
    bio: "B2B sales closer.",
    location: "Nairobi, Kenya",
    skills: [{ name: "Sales", level: "Expert", yearsOfExperience: 6 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Growth Corp",
      role: "Sales Executive",
      startDate: "2018-01",
      endDate: "",
      isCurrent: true,
      description: "Exceeded revenue targets.",
      technologies: ["CRM"]
    }],
    education: [{
      institution: "KU",
      degree: "Bachelor's",
      fieldOfStudy: "Business",
      startYear: 2012,
      endYear: 2016
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Quentin",
    lastName: "Toure",
    email: "quentin@email.com",
    headline: "Product Manager",
    bio: "Builds user-loved products.",
    location: "Abidjan, Ivory Coast",
    skills: [{ name: "Product Management", level: "Advanced", yearsOfExperience: 5 }],
    languages: [{ name: "French", proficiency: "Fluent" }],
    experience: [{
      company: "SaaS Co",
      role: "Product Manager",
      startDate: "2019-03",
      endDate: "",
      isCurrent: true,
      description: "Launched multiple products.",
      technologies: ["Jira"]
    }],
    education: [{
      institution: "UCAO",
      degree: "Bachelor's",
      fieldOfStudy: "Business",
      startYear: 2013,
      endYear: 2017
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Rebecca",
    lastName: "Asante",
    email: "rebecca@email.com",
    headline: "Customer Support Lead",
    bio: "Excellent client relationship manager.",
    location: "Accra, Ghana",
    skills: [{ name: "Customer Support", level: "Advanced", yearsOfExperience: 5 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "HelpDesk Ltd",
      role: "Support Lead",
      startDate: "2020-01",
      endDate: "",
      isCurrent: true,
      description: "Managed support teams.",
      technologies: ["Zendesk"]
    }],
    education: [{
      institution: "UG",
      degree: "Bachelor's",
      fieldOfStudy: "Management",
      startYear: 2014,
      endYear: 2018
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Samuel",
    lastName: "Okoro",
    email: "samuel@email.com",
    headline: "Machine Learning Engineer",
    bio: "Builds AI systems.",
    location: "Lagos, Nigeria",
    skills: [{ name: "Python", level: "Expert", yearsOfExperience: 5 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "AI Labs",
      role: "ML Engineer",
      startDate: "2020-01",
      endDate: "",
      isCurrent: true,
      description: "Built recommendation systems.",
      technologies: ["Python"]
    }],
    education: [{
      institution: "UNILAG",
      degree: "Master's",
      fieldOfStudy: "AI",
      startYear: 2017,
      endYear: 2019
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  },

  {
    firstName: "Tina",
    lastName: "Mukasa",
    email: "tina@email.com",
    headline: "Finance Analyst",
    bio: "Financial planning expert.",
    location: "Kampala, Uganda",
    skills: [{ name: "Excel", level: "Expert", yearsOfExperience: 6 }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    experience: [{
      company: "Capital Finance",
      role: "Finance Analyst",
      startDate: "2019-02",
      endDate: "",
      isCurrent: true,
      description: "Built budgeting models.",
      technologies: ["Excel"]
    }],
    education: [{
      institution: "Makerere",
      degree: "Bachelor's",
      fieldOfStudy: "Finance",
      startYear: 2013,
      endYear: 2017
    }],
    certifications: [],
    projects: [],
    availability: { status: "Available", type: "Full-time", startDate: "" },
    socialLinks: { linkedin: "", github: "", portfolio: "" },
    source: "umurava",
    jobIds: []
  }
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