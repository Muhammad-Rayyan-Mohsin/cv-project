/**
 * Response parser for AI analysis output.
 *
 * Primary: JSON parsing with Zod validation.
 */

import {
  CategorizationResponseSchema,
  CvResponseSchema,
  type CategorizationResponse,
  type CvResponse,
} from "./validation";

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

/** Strip markdown code fences if present, then parse JSON. */
function cleanAndParseJson(text: string): unknown {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ``` fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// JSON parsers (primary)
// ---------------------------------------------------------------------------

export interface ParsedCategorization {
  summary: string;
  roles: {
    title: string;
    description: string;
    matchingRepoNames: string[];
    skills: string[];
  }[];
}

/**
 * Parse a JSON categorization response from the AI.
 * Expected shape: { summary, roles: [{ title, description, repos: [], skills: [] }] }
 */
export function parseCategorizationJson(text: string): ParsedCategorization {
  const raw = cleanAndParseJson(text);
  const parsed = CategorizationResponseSchema.parse(raw);

  return {
    summary: parsed.summary,
    roles: parsed.roles.map((role) => ({
      title: role.title,
      description: role.description,
      matchingRepoNames: role.repos,
      skills: role.skills,
    })),
  };
}

export interface ParsedCvResponse {
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    bullets: string[];
    technologies: string[];
    repoUrl: string;
  }[];
  certifications: string[];
}

/**
 * Parse a JSON CV response from the AI.
 * Expected shape: { summary, skills: [...], experience: [...], certifications: [...] }
 */
export function parseCvJson(text: string): ParsedCvResponse {
  const raw = cleanAndParseJson(text);
  const parsed = CvResponseSchema.parse(raw);

  return {
    summary: parsed.summary,
    skills: parsed.skills,
    experience: parsed.experience.map((e) => ({
      ...e,
      repoUrl: e.repoUrl ?? "",
    })),
    certifications: parsed.certifications,
  };
}
