import mongoose, { Schema, Document } from "mongoose";

export interface IJob extends Document {
  title: string;
  description: string;
  requiredSkills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  location: string;
  jobType: string;
  status: string;
  createdBy: mongoose.Types.ObjectId;
  applicantsCount: number;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requiredSkills: {
      type: [String],
      required: [true, "Required skills are needed"],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: 0,
    },
    educationLevel: {
      type: String,
      required: [true, "Education level is required"],
      enum: ["High School", "Bachelor", "Master", "PhD", "Any"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Remote"],
      default: "Full-time",
    },
    status: {
      type: String,
      enum: ["open", "closed", "screening"],
      default: "open",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicantsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IJob>("Job", JobSchema);