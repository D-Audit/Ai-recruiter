import mongoose, { Schema, Document } from "mongoose";

export interface IScreeningResult extends Document {
  jobId: mongoose.Types.ObjectId;
  totalApplicants: number;
  shortlistedCount: number;
  rankedCandidates: {
    candidateId: mongoose.Types.ObjectId;
    rank: number;
    score: number;
    strengths: string;
    gaps: string;
    recommendation: string;
    skillsMatched: string[];
    skillsMissing: string[];
    confidence: string;
    upskillingPaths: { skill: string; reason: string; suggestedResource: string }[];
    adjacentRoles: string[];
  }[];
  biasNotice: string;
  screenedAt: Date;
}

const ScreeningResultSchema = new Schema<IScreeningResult>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    totalApplicants: { type: Number, required: true },
    shortlistedCount: { type: Number, required: true },
    rankedCandidates: [
      {
        candidateId: { type: Schema.Types.ObjectId, ref: "Applicant" },
        rank: { type: Number },
        score: { type: Number },
        strengths: { type: String },
        gaps: { type: String },
        recommendation: { type: String },
        skillsMatched: { type: [String], default: [] },
        skillsMissing: { type: [String], default: [] },
        confidence: { type: String, default: "Medium" },
        upskillingPaths: [
          {
            skill:             { type: String },
            reason:            { type: String },
            suggestedResource: { type: String },
          },
        ],
        adjacentRoles: { type: [String], default: [] },
      },
    ],
    biasNotice: { type: String, default: "" },
    screenedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IScreeningResult>("ScreeningResult", ScreeningResultSchema);