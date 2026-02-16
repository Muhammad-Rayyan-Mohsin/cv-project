export interface PersonalDetails {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github: string;
  website: string;
  photoUrl?: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  details: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  bullets: string[];
  technologies: string[];
  repoUrl?: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export type TemplateId = "classic" | "modern" | "professional" | "creative";

export interface StructuredCV {
  personalDetails: PersonalDetails;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  templateId?: TemplateId;
}
