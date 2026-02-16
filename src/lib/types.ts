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
  readme: string | null;
}

export interface CareerRole {
  role: string;
  description: string;
  matchingRepos: RepoDetail[];
  skills: string[];
  cv: string;
}

export interface AnalysisResult {
  roles: CareerRole[];
  summary: string;
  sessionId?: string | null;
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
    created_at: string;
  }[];
}
