// src/models/Applicant.model.ts
// UPDATED — added resumeUrl field. Everything else is unchanged.

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
  resumeUrl?: string; // NEW — set when a file is uploaded or URL is imported
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
          enum: ["Basic", "Conversational", "Fluent", "Native"],
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
      },
    ],

    education: [
      {
        institution:  { type: String, default: "" },
        degree:       { type: String, default: "" },
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
      },
    ],

    availability: {
      status: {
        type: String,
        enum: ["Available", "Open to Opportunities", "Not Available"],
        default: "Available",
      },
      type: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract"],
        default: "Full-time",
      },
      startDate: { type: String, default: "" },
    },

    socialLinks: {
      linkedin:  { type: String, default: "" },
      github:    { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },

    aiScore:         { type: Number, default: null },
    confidenceLevel: { type: String, enum: ["High", "Medium", "Low", null], default: null },
    portfolioRating: { type: Number, default: null },

    source: {
      type: String,
      enum: ["umurava", "external"],
      default: "umurava",
    },

    jobIds: {
      type: [Schema.Types.ObjectId],
      ref: "Job",
      default: [],
    },

    // ── NEW FIELD ─────────────────────────────────────────────────────────────
    // For /upload/resume: empty string (add S3/Cloudinary URL here if you store files)
    // For /upload/url:    the original URL the recruiter pasted
    // Powers the "View Resume" button in the candidate detail page
    resumeUrl: { type: String, default: "" },
    // ─────────────────────────────────────────────────────────────────────────
  },
  { timestamps: true }
);

// Enforce one document per unique email at the DB level
ApplicantSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IApplicant>("Applicant", ApplicantSchema);