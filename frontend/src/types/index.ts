export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
}

export type JobStatus = "open" | "closed" | "screening";

export interface Job {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  yearsOfExperience: number;
  educationLevel: string;
  location: string;
  jobType: string;
  status: JobStatus | string;
  applicantsCount: number;
  createdAt: string;
}

export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience: number;
}

export interface Language {
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string[];
  isCurrent: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link: string;
  startDate: string;
  endDate: string;
}

export interface Availability {
  status: "Available" | "Open to Opportunities" | "Not Available";
  type: "Full-time" | "Part-time" | "Contract";
  startDate?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export type ApplicantSource = "umurava" | "external";

export interface Applicant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  skills: Skill[];
  languages?: Language[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  projects?: Project[];
  availability: Availability;
  socialLinks?: SocialLinks;
  aiScore?: number;
  confidenceLevel?: "High" | "Medium" | "Low" | string;
  source: ApplicantSource | string;
  jobIds: string[];
  /** URL to the uploaded resume file (set by backend when a file or URL is uploaded). */
  resumeUrl?: string;
}

export type RecommendationLevel = "Shortlist" | "Consider" | "Not Selected";

export interface UpskillingPath {
  skill: string;
  reason: string;
  suggestedResource: string;
}

export interface CandidateResult {
  candidateId: Applicant | string;
  rank: number;
  score: number;
  strengths: string;
  gaps: string;
  recommendation: RecommendationLevel | string;
  skillsMatched: string[];
  skillsMissing: string[];
  confidence: "High" | "Medium" | "Low" | string;
  upskillingPaths?: UpskillingPath[];
  adjacentRoles?: string[];
}

export interface ScreeningResult {
  _id: string;
  jobId: string;
  totalApplicants: number;
  shortlistedCount: number;
  rankedCandidates: CandidateResult[];
  biasNotice: string;
  screenedAt: string;
  fromCache?: boolean;
}

export interface ComparisonRow {
  candidateId: string;
  fullName: string;
  score: number;
  topStrength: string;
  biggestGap: string;
  verdict: string;
}

export interface ComparisonResult {
  winner: string;
  winnerReason: string;
  comparison: ComparisonRow[];
  biasNotice?: string;
}