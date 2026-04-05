export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  location: string;
  jobType: string;
  status: string;
  applicantsCount: number;
  createdAt: string;
}

export interface Applicant {
  _id: string;
  fullName: string;
  email: string;
  skills: string[];
  yearsOfExperience: number;
  education: string;
  location: string;
  languages: string[];
  source: string;
  jobId: string;
}

export interface CandidateResult {
  candidateId: any;
  rank: number;
  score: number;
  strengths: string;
  gaps: string;
  recommendation: string;
  skillsMatched: string[];
  skillsMissing: string[];
}

export interface ScreeningResult {
  _id: string;
  jobId: string;
  totalApplicants: number;
  shortlistedCount: number;
  rankedCandidates: CandidateResult[];
  biasNotice: string;
  screenedAt: string;
}