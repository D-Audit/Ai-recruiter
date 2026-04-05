import mongoose, { Schema, Document } from "mongoose";

export interface IApplicant extends Document {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  yearsOfExperience: number;
  education: string;
  location: string;
  languages: string[];
  pastProjects: {
    title: string;
    description: string;
    techUsed: string[];
  }[];
  resumeUrl: string;
  source: string;
  jobId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ApplicantSchema = new Schema<IApplicant>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      required: [true, "Skills are required"],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: 0,
      default: 0,
    },
    education: {
      type: String,
      required: [true, "Education is required"],
    },
    location: {
      type: String,
      default: "",
    },
    languages: {
      type: [String],
      default: ["English"],
    },
    pastProjects: [
      {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        techUsed: { type: [String], default: [] },
      },
    ],
    resumeUrl: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["umurava", "external"],
      default: "umurava",
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      
    },
  },
  { timestamps: true }
);

export default mongoose.model<IApplicant>("Applicant", ApplicantSchema);