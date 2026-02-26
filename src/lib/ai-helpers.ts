/**
 * Shared AI utility functions and constants.
 * Extracted from analyze/route.ts to be shared between /api/analyze and /api/categorize.
 */

import { RepoDetail } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { cache, CacheKeys } from "@/lib/cache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_GENERATION_URL = "https://openrouter.ai/api/v1/generation";

// ---------------------------------------------------------------------------
// Logger -- suppresses info logs in production
// ---------------------------------------------------------------------------

export const log = {
  info: (...args: unknown[]) =>
    process.env.NODE_ENV !== "production" && console.log("[ai]", ...args),
  warn: (...args: unknown[]) => console.warn("[ai]", ...args),
  error: (...args: unknown[]) => console.error("[ai]", ...args),
};

// ---------------------------------------------------------------------------
// Prompt injection mitigation
// ---------------------------------------------------------------------------

const SUSPICIOUS_PATTERNS = [
  /^ignore\b/i,
  /^system:/i,
  /^assistant:/i,
  /^<\|/,
  /^###\s*(system|instruction)/i,
  /^you are now/i,
  /^forget (all |your |previous )/i,
  /^disregard/i,
];

export function sanitizeUserContent(text: string): string {
  return text
    .split("\n")
    .filter((line) => !SUSPICIOUS_PATTERNS.some((pat) => pat.test(line.trim())))
    .join("\n");
}

export function wrapUserData(text: string, maxLen?: number): string {
  const sanitized = sanitizeUserContent(text);
  const truncated = maxLen ? sanitized.slice(0, maxLen) : sanitized;
  return `<user_data>${truncated}</user_data>`;
}

// ---------------------------------------------------------------------------
// Reusable OpenRouter helper
// ---------------------------------------------------------------------------

export interface OpenRouterResult {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  generationId: string | null;
  model: string;
}

export async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature = 0.7,
  agentName?: string,
): Promise<OpenRouterResult> {
  const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  };

  log.info(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] Starting API call`);
  log.info(`  Model: ${model}, Max tokens: ${maxTokens}, Temperature: ${temperature}`);

  const startTime = Date.now();

  // Abort after 120 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "CV Tailor - GitHub Portfolio Analyzer",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      log.error(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] API error (${elapsedMs}ms)`);
      log.error(`  Status: ${response.status} ${response.statusText}`);
      log.error(`  Response: ${errorData.slice(0, 500)}`);

      let errorCode = "UNKNOWN";
      let errorMessage = "API request failed";
      try {
        const parsed = JSON.parse(errorData);
        errorCode = parsed.error?.code || response.status;
        errorMessage = parsed.error?.message || parsed.error?.metadata?.raw || errorMessage;
      } catch {
        errorMessage = errorData;
      }

      const err = new Error(errorMessage) as Error & { code?: number | string; statusCode?: number };
      err.code = errorCode;
      err.statusCode = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      log.error(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] No content in response (${elapsedMs}ms)`);
      throw new Error("No response content from AI");
    }

    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const generationId = data.id || null;
    const returnedModel = data.model || model;

    log.info(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] Success (${elapsedMs}ms)`);
    log.info(`  Model: ${returnedModel}, Gen ID: ${generationId}`);
    log.info(`  Tokens: ${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion = ${usage.total_tokens} total`);

    return {
      content,
      usage,
      generationId,
      model: returnedModel,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Background cost tracking (fire and forget)
// ---------------------------------------------------------------------------

export async function fetchAndRecordCosts(
  generationIds: string[],
  sessionId: string | null,
  profileId: string,
  modelUsed: string,
  aggregatedUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  apiKey: string,
) {
  // Brief delay to let OpenRouter populate cost data
  await new Promise((r) => setTimeout(r, 3000));

  async function fetchCost(genId: string): Promise<number> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const genRes = await fetch(
          `${OPENROUTER_GENERATION_URL}?id=${genId}`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        if (genRes.ok) {
          const genData = await genRes.json();
          const cost = genData.data?.total_cost ?? 0;
          if (cost > 0) return cost;
        }
      } catch {
        // Silently skip
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
    return 0;
  }

  log.info(`Fetching costs for ${generationIds.length} generation IDs`);

  const costs = await Promise.all(generationIds.map(fetchCost));
  const totalCost = costs.reduce((sum, c) => sum + c, 0);

  log.info(`Total cost: $${totalCost.toFixed(6)}`);
  if (totalCost === 0) {
    log.warn("Cost is $0 -- OpenRouter may not have populated cost data yet");
  }

  await supabase.from("token_usage").insert({
    user_id: profileId,
    session_id: sessionId,
    model: modelUsed,
    prompt_tokens: aggregatedUsage.prompt_tokens,
    completion_tokens: aggregatedUsage.completion_tokens,
    total_tokens: aggregatedUsage.total_tokens,
    estimated_cost_usd: totalCost,
  });

  cache.delete(CacheKeys.usage(profileId));
}

// ---------------------------------------------------------------------------
// Agent prompts
// ---------------------------------------------------------------------------

export const CATEGORIZER_SYSTEM = `You are an expert career advisor. You analyze GitHub repositories to understand a developer's skills and experience, then categorize their projects into distinct career roles.

Your analysis should be thorough and intelligent:
- Look at the languages, frameworks, topics, README content, and project descriptions
- Identify patterns that indicate expertise in specific career domains
- Group related projects under the most fitting career role
- Each project must be assigned to ONLY ONE role based on its primary domain

You MUST respond with valid JSON only. No markdown, no code fences, no prose outside the JSON.`;

export const CV_WRITER_SYSTEM = `You are an expert CV writer. You generate professional, ATS-friendly structured CV content tailored to a specific career role based on a developer's GitHub projects.

Your writing should:
- Focus on achievements and impact, not just descriptions
- Use strong action verbs and quantify where possible (users, performance, scale)
- Be concise yet detailed — each bullet should demonstrate clear value
- Tailor skill categories and language to the specific career role

You MUST respond with valid JSON only. No markdown, no code fences, no prose outside the JSON.`;

// ---------------------------------------------------------------------------
// Server-side README fetching (lazy-loaded for selected repos only)
// ---------------------------------------------------------------------------

const README_BATCH_SIZE = 10;

export async function fetchReadmeForRepo(
  accessToken: string,
  fullName: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/readme`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 2000);
  } catch {
    return null;
  }
}

export async function enrichReposWithReadmes(
  accessToken: string,
  repos: RepoDetail[],
): Promise<RepoDetail[]> {
  const results: RepoDetail[] = [];

  for (let i = 0; i < repos.length; i += README_BATCH_SIZE) {
    const batch = repos.slice(i, i + README_BATCH_SIZE);
    const readmes = await Promise.all(
      batch.map((repo) =>
        repo.readme
          ? Promise.resolve(repo.readme)
          : fetchReadmeForRepo(accessToken, repo.full_name),
      ),
    );
    batch.forEach((repo, idx) => {
      results.push({ ...repo, readme: readmes[idx] });
    });
  }

  return results;
}
