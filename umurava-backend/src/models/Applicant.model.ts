// src/models/Applicant.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IApplicant extends Document {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  skills: { name: string; level: string; yearsOfExperience: number }[];
  languages: { name: string; proficiency: string }[];
  experience: {
    company: string; role: string; startDate: string; endDate: string;
    description: string; technologies: string[]; isCurrent: boolean;
  }[];
  education: {
    institution: string; degree: string; fieldOfStudy: string;
    startYear: number; endYear: number;
  }[];
  certifications: { name: string; issuer: string; issueDate: string }[];
  projects: {
    name: string; description: string; technologies: string[];
    role: string; link: string; startDate: string; endDate: string;
  }[];
  availability: { status: string; type: string; startDate: string };
  socialLinks: { linkedin: string; github: string; portfolio: string };
  aiScore?: number;
  confidenceLevel?: string;
  portfolioRating?: number;
  source: string;
  jobIds: mongoose.Types.ObjectId[];
  resumeUrl?: string;
  createdAt: Date;
}

const ApplicantSchema = new Schema<IApplicant>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    headline:  { type: String, default: "" },
    bio:       { type: String, default: "" },
    location:  { type: String, default: "" },

    skills: [
      {
        name: { type: String, required: true },
        level: {
          type: String,
          // SET BY: resume prompt (Gemini)
          // RISK: LOW — prompt explicitly lists all 4 values and instructs
          // Gemini to use only these. Stable.
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
          default: "Intermediate",
        },
        yearsOfExperience: { type: Number, default: 0 },
      },
    ],

    languages: [
      {
        name: { type: String },
        proficiency: {
          type: String,
          // SET BY: resume prompt (Gemini)
          // RISK: HIGH — this was the bug. "Proficient" is a real, commonly used
          // term on resumes and Gemini correctly returns it. The original 4-value
          // enum was too narrow. All values below are legitimate proficiency
          // descriptors that appear on real CVs and LinkedIn profiles:
          //   Basic                          → A1/A2
          //   Elementary                     → A2
          //   Limited Working Proficiency    → B1 (standard LinkedIn term)
          //   Conversational                 → B1/B2
          //   Proficient                     → B2/C1 (the term that caused the crash)
          //   Professional Working Proficiency → C1 (standard LinkedIn term)
          //   Fluent                         → C1/C2
          //   Bilingual                      → C2 (two native-level languages)
          //   Native                         → mother tongue
          enum: [
            "Basic",
            "Elementary",
            "Limited Working Proficiency",
            "Conversational",
            "Proficient",
            "Professional Working Proficiency",
            "Fluent",
            "Bilingual",
            "Native",
          ],
          default: "Fluent",
        },
      },
    ],

    experience: [
      {
        company:      { type: String, default: "" },
        role:         { type: String, default: "" },
        startDate:    { type: String, default: "" },
        endDate:      { type: String, default: "" },
        description:  { type: String, default: "" },
        technologies: { type: [String], default: [] },
        isCurrent:    { type: Boolean, default: false },
        // SET BY: resume prompt (Gemini) — all free text from the resume.
        // No enum on any of these fields. Zero risk of enum crash.
      },
    ],

    education: [
      {
        institution:  { type: String, default: "" },
        degree:       { type: String, default: "" },
        // SET BY: resume prompt (Gemini) — degree returned verbatim from resume.
        // e.g. "BSc Computer Science", "Licence en Informatique", "HND".
        // NO ENUM intentionally — forcing one would break non-English or
        // non-standard degrees. Free text is correct here.
        fieldOfStudy: { type: String, default: "" },
        startYear:    { type: Number },
        endYear:      { type: Number },
      },
    ],

    certifications: [
      {
        name:      { type: String },
        issuer:    { type: String },
        issueDate: { type: String },
        // SET BY: resume prompt (Gemini) — all free text. No enum. Zero risk.
      },
    ],

    projects: [
      {
        name:         { type: String },
        description:  { type: String },
        technologies: { type: [String], default: [] },
        role:         { type: String, default: "" },
        link:         { type: String, default: "" },
        startDate:    { type: String, default: "" },
        endDate:      { type: String, default: "" },
        // SET BY: resume prompt (Gemini) — all free text. No enum. Zero risk.
      },
    ],

    availability: {
      status: {
        type: String,
        // SET BY: resume prompt (Gemini)
        // RISK: LOW — prompt explicitly lists the 3 options and says
        // "If not mentioned → use Available". resume.service.ts also
        // sanitizes this field as a second safety net.
        enum: ["Available", "Open to Opportunities", "Not Available"],
        default: "Available",
      },
      type: {
        type: String,
        // SET BY: resume prompt (Gemini)
        // RISK: MEDIUM — prompt lists 3 values, but real resumes also say
        // "Freelance" and "Internship". Added both here as a safety measure
        // since resume.service.ts only checks against the original 3.
        enum: ["Full-time", "Part-time", "Contract", "Freelance", "Internship"],
        default: "Full-time",
      },
      startDate: { type: String, default: "" },
    },

    socialLinks: {
      linkedin:  { type: String, default: "" },
      github:    { type: String, default: "" },
      portfolio: { type: String, default: "" },
      // SET BY: resume prompt (Gemini) — free text URLs. No enum. Zero risk.
    },

    aiScore:         { type: Number, default: null },

    confidenceLevel: {
      type: String,
      // SET BY: screening prompt (Gemini) — not the resume prompt.
      // The screening prompt explicitly defines:
      //   "High" (score ≥ 70), "Medium" (50–69), "Low" (< 50)
      // This is tightly controlled and stable. Low risk.
      enum: ["High", "Medium", "Low", null],
      default: null,
    },

    portfolioRating: { type: Number, default: null },

    source: {
      type: String,
      // SET BY: application code — not Gemini.
      // "umurava" for seeded profiles, "external" for uploaded resumes.
      // Hardcoded in resume.service.ts and seed files. Zero risk.
      enum: ["umurava", "external"],
      default: "umurava",
    },

    jobIds: {
      type: [Schema.Types.ObjectId],
      ref: "Job",
      default: [],
    },

    resumeUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

ApplicantSchema.index({ email: 1 }, { unique: true });
export default mongoose.model<IApplicant>("Applicant", ApplicantSchema);