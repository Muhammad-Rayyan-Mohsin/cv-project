import { z } from "zod";

// ---------------------------------------------------------------------------
// Analyze request body
// ---------------------------------------------------------------------------

const RepoDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  languages_url: z.string(),
  topics: z.array(z.string()),
  stargazers_count: z.number(),
  forks_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
  fork: z.boolean(),
  private: z.boolean(),
  size: z.number(),
  default_branch: z.string(),
  languages: z.record(z.number()),
  readme: z.string().nullable().optional(),
});

export const AnalyzeRequestSchema = z.object({
  repos: z.array(RepoDetailSchema).min(1, "At least one repo is required").max(50, "Maximum 50 repos allowed"),
  userName: z.string().max(100).optional(),
  userBio: z.string().max(1000).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const CategorizeRequestSchema = z.object({
  repos: z.array(RepoDetailSchema).min(1).max(200),
  userName: z.string().max(100).optional(),
  userBio: z.string().max(1000).optional(),
});

export const GenerateCVsRequestSchema = z.object({
  categories: z.array(z.object({
    title: z.string(),
    description: z.string(),
    repoNames: z.array(z.string()),
    skills: z.array(z.string()),
  })).min(1, "At least one category is required"),
  repos: z.array(RepoDetailSchema).min(1),
  userName: z.string().max(100).optional(),
  userBio: z.string().max(1000).optional(),
  categorizationId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// CV save request body (structured CV validation)
// ---------------------------------------------------------------------------

const PersonalDetailsSchema = z.object({
  fullName: z.string().max(200),
  email: z.string().max(320),
  phone: z.string().max(30),
  location: z.string().max(200),
  linkedIn: z.string().max(500),
  github: z.string().max(200),
  website: z.string().max(500),
  photoUrl: z.string().max(1000).optional(),
});

const EducationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  details: z.string(),
});

const ExperienceEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
  technologies: z.array(z.string()),
  repoUrl: z.string().optional(),
});

const SkillCategorySchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
});

export const StructuredCVSchema = z.object({
  personalDetails: PersonalDetailsSchema,
  summary: z.string().max(2000),
  skills: z.array(SkillCategorySchema),
  experience: z.array(ExperienceEntrySchema),
  education: z.array(EducationEntrySchema),
  certifications: z.array(z.string()),
  templateId: z.enum(["classic", "modern", "professional", "creative"]).optional(),
});

export const CvSaveRequestSchema = z.object({
  structuredCv: StructuredCVSchema,
});

// ---------------------------------------------------------------------------
// Profile update request body
// ---------------------------------------------------------------------------

export const ProfileUpdateSchema = z.object({
  fullName: z.string().max(200).optional(),
  email: z.string().email("Invalid email format").max(320).optional().or(z.literal("")),
  phone: z.string().max(30).regex(/^[\d\s\-+()]*$/, "Invalid phone number format").optional().or(z.literal("")),
  location: z.string().max(200).optional(),
  linkedIn: z
    .string()
    .max(500)
    .refine(
      (val) => !val || val.startsWith("https://linkedin.com/") || val.startsWith("https://www.linkedin.com/"),
      { message: "LinkedIn URL must start with https://linkedin.com/ or https://www.linkedin.com/" },
    )
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Invalid website URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  education: z.array(EducationEntrySchema).optional(),
  workExperience: z.array(ExperienceEntrySchema).optional(),
});

// ---------------------------------------------------------------------------
// AI response schemas (for validating parsed JSON from LLM)
// ---------------------------------------------------------------------------

export const CategorizationResponseSchema = z.object({
  summary: z.string(),
  roles: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        repos: z.array(z.string()),
        skills: z.array(z.string()),
      }),
    )
    .min(1, "At least one role is required"),
});

export type CategorizationResponse = z.infer<typeof CategorizationResponseSchema>;

export const CvResponseSchema = z.object({
  summary: z.string(),
  skills: z.array(
    z.object({
      category: z.string(),
      items: z.array(z.string()),
    }),
  ),
  experience: z.array(
    z.object({
      title: z.string(),
      organization: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      bullets: z.array(z.string()),
      technologies: z.array(z.string()),
      repoUrl: z.string().optional().default(""),
    }),
  ),
  certifications: z.array(z.string()).optional().default([]),
});

export type CvResponse = z.infer<typeof CvResponseSchema>;
