export interface JobInput {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  location: string;
}

export interface ApplicantInput {
  id: string;
  fullName: string;
  email: string;
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
  source: "umurava" | "external";
}

export interface CandidateResult {
  candidateId: string;
  rank: number;
  score: number;
  strengths: string;
  gaps: string;
  recommendation: string;
  skillsMatched: string[];
  skillsMissing: string[];
}

export interface ScreeningOutput {
  jobId: string;
  totalApplicants: number;
  shortlistedCount: number;
  rankedCandidates: CandidateResult[];
  screenedAt: Date;
  biasNotice: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}