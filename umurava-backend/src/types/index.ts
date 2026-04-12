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
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  location: string;
  skills: {
    name: string;
    level: string;
    yearsOfExperience: number;
  }[];
  languages: {
    name: string;
    proficiency: string;
  }[];
  experience: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies: string[];
    isCurrent: boolean;
  }[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    role: string;
  }[];
  availability: {
    status: string;
    type: string;
  };
  source: string;
}

export interface UpskillingPath {
  skill: string;
  reason: string;
  suggestedResource: string;
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
  confidence: string;
  upskillingPaths?: UpskillingPath[];
  adjacentRoles?: string[];
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