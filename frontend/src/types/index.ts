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
  startDate: string;
}

export interface SocialLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface Applicant {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  skills: Skill[];
  languages: Language[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  availability: Availability;
  socialLinks: SocialLinks;
  // Extensibility fields
  aiScore?: number;
  confidenceLevel?: string;
  portfolioRating?: number;
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
  confidence: string;
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