export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  languages_url: string;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  private: boolean;
  size: number;
  default_branch: string;
}

export interface RepoDetail extends Repository {
  languages: Record<string, number>;
  readme?: string | null;
}

import { StructuredCV } from "./cv-types";

export interface CareerRole {
  role: string;
  description: string;
  matchingRepos: RepoDetail[];
  skills: string[];
  cv: string;
  structuredCv?: StructuredCV;
}

export interface TokenUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AnalysisResult {
  roles: CareerRole[];
  summary: string;
  sessionId?: string | null;
  tokenUsage?: TokenUsage;
  cvIds?: string[];
}

export interface UsageRecord {
  id: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  createdAt: string;
}

export interface UsageStats {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  totalRequests: number;
  records: UsageRecord[];
}

/** Result of pre-categorization step */
export interface CategorizationResult {
  summary: string;
  roles: { title: string; description: string; repos: string[]; skills: string[] }[];
  categorizationId?: string;
  tokenUsage?: TokenUsage;
}

/** Request shape for CV generation with pre-categorized data */
export interface GenerateCVsRequest {
  categories: { title: string; description: string; repoNames: string[]; skills: string[] }[];
  repos: RepoDetail[];
  userName?: string;
  userBio?: string;
  categorizationId?: string;
}

export interface HistorySession {
  id: string;
  summary: string | null;
  status: string;
  selected_repos: { name: string; full_name: string; html_url: string }[];
  created_at: string;
  generated_cvs: {
    id: string;
    role_title: string;
    role_description: string | null;
    skills: string[];
    matching_repos: { name: string; html_url: string }[];
    cv_content: string;
    structured_cv: StructuredCV | null;
    created_at: string;
  }[];
}
