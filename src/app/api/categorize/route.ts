import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import { parseCategorizationJson } from "@/lib/xml-parser";
import { CategorizeRequestSchema } from "@/lib/validation";
import { RepoDetail } from "@/lib/types";
import { trackEvent } from "@/lib/tracking";
import { env } from "@/lib/env";
import {
  callOpenRouter,
  CATEGORIZER_SYSTEM,
  sanitizeUserContent,
  wrapUserData,
  enrichReposWithReadmes,
  log,
} from "@/lib/ai-helpers";

// ---------------------------------------------------------------------------
// GET: Return cached categorization (no AI call)
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check in-memory cache first
  const cacheKey = CacheKeys.categorization(session.profileId);
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  // Check Supabase for persisted categorization
  const { data } = await supabase
    .from("repo_categorizations")
    .select("*")
    .eq("user_id", session.profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (data) {
    const result = {
      summary: data.summary,
      roles: data.roles,
      categorizationId: data.id,
    };
    cache.set(cacheKey, result, CacheTTL.CATEGORIZATION);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "No cached categorization" }, { status: 404 });
}

// ---------------------------------------------------------------------------
// POST: Run fresh AI categorization
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.profileId || !session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const { success: rateLimitOk } = rateLimit(
    `categorize:${session.profileId}`,
    5,
    60 * 60 * 1000,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 5 categorizations per hour." },
      { status: 429 },
    );
  }

  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = CategorizeRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { repos: rawRepos, userName, userBio } = parseResult.data;

  const apiKey = env.openRouter.apiKey;

  // Enrich repos with READMEs
  log.info(`[Categorize] Fetching READMEs for ${rawRepos.length} repos...`);
  const enrichedRepos = await enrichReposWithReadmes(
    session.accessToken,
    rawRepos as RepoDetail[],
  );
  log.info("[Categorize] README enrichment complete");

  // Build project summaries (same as categorization in analyze)
  const projectSummaries = enrichedRepos.map((repo: RepoDetail) => ({
    name: repo.name,
    description: repo.description,
    languages: repo.languages,
    topics: repo.topics,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    readme_excerpt: wrapUserData(repo.readme?.slice(0, 500) || "No README", 500),
    url: repo.html_url,
    last_updated: repo.pushed_at,
  }));

  // Build the categorization prompt (same as Agent 1 in analyze/route.ts)
  const sanitizedUserName = wrapUserData(
    sanitizeUserContent(userName || "GitHub User"),
    100,
  );
  const sanitizedUserBio = wrapUserData(
    sanitizeUserContent(userBio || "Not provided"),
    500,
  );

  const userPrompt = `Analyze the following GitHub profile and repositories, then categorize them into distinct career roles.

User: ${sanitizedUserName}
Bio: ${sanitizedUserBio}

Repositories (${projectSummaries.length} total):
${JSON.stringify(projectSummaries, null, 2)}

Respond with the following JSON structure exactly:

{
  "summary": "A brief overview of the developer's overall profile and strengths",
  "roles": [
    {
      "title": "Role Title (e.g., Machine Learning Engineer)",
      "description": "Why this role fits based on the projects",
      "repos": ["repo1", "repo2"],
      "skills": ["skill1", "skill2", "skill3"]
    }
  ]
}

Rules:
- Create between 2-6 roles depending on the diversity of projects
- **CRITICAL**: Each repository must be assigned to ONLY ONE role based on its primary category/domain
- A repository cannot appear in multiple roles' repos array
- Match repositories to roles by their primary technology stack and purpose
- A role CAN have multiple repositories if they all fit that category
- Each role should have at least 1 matching repo
- List 3-8 top skills per role (technologies, frameworks, concepts)
- Do NOT generate CVs -- only categorize projects into roles
- Use exact repository names from the input data

Example: If there are 5 repos (ai-model, ml-pipeline, react-app, vue-dashboard, mobile-app):
CORRECT:
- AI/ML Engineer: ["ai-model", "ml-pipeline"]
- Frontend Developer: ["react-app", "vue-dashboard"]
- Mobile Developer: ["mobile-app"]
WRONG: DO NOT assign "react-app" to AI/ML Engineer role`;

  // Call OpenRouter
  let result;
  try {
    result = await callOpenRouter(
      apiKey,
      CATEGORIZER_SYSTEM,
      userPrompt,
      4000,
      0.5,
      "Categorizer",
    );
  } catch (err: unknown) {
    const apiErr = err as Error & { statusCode?: number; code?: number | string };
    log.error("[Categorize] AI call failed:", apiErr);

    if (apiErr.statusCode === 429) {
      return NextResponse.json(
        {
          error: "Rate limited",
          errorType: "RATE_LIMIT",
          message:
            apiErr.message ||
            "The AI service is temporarily rate-limited. Please try again in a few moments.",
        },
        { status: 429 },
      );
    }

    if (apiErr.statusCode === 402 || apiErr.code === 402) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          errorType: "NO_CREDITS",
          message: "Sorry, we're out of credits :(",
        },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        error: "AI categorization failed",
        errorType: "ANALYSIS_FAILED",
        message: apiErr.message || "AI categorization failed",
      },
      { status: 500 },
    );
  }

  // Parse response
  const categorization = parseCategorizationJson(result.content);

  // Validate repo names (hallucination filtering)
  const validRepoNames = new Set(enrichedRepos.map((r: RepoDetail) => r.name));
  const validFullNames = new Set(
    enrichedRepos.map((r: RepoDetail) => r.full_name).filter(Boolean),
  );
  for (const role of categorization.roles) {
    role.matchingRepoNames = role.matchingRepoNames.filter((name) => {
      if (validRepoNames.has(name) || validFullNames.has(name)) return true;
      log.warn(`Hallucinated repo "${name}" in role "${role.title}"`);
      return false;
    });
  }

  // Map to response format
  const responseRoles = categorization.roles.map((r) => ({
    title: r.title,
    description: r.description,
    repos: r.matchingRepoNames,
    skills: r.skills,
  }));

  // Save to Supabase
  const model = env.openRouter.model;
  let categorizationId: string | null = null;
  try {
    const { data: saved } = await supabase
      .from("repo_categorizations")
      .insert({
        user_id: session.profileId,
        summary: categorization.summary,
        roles: responseRoles,
        repo_count: enrichedRepos.length,
        model: model,
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0,
      })
      .select("id")
      .single();
    if (saved) categorizationId = saved.id;
  } catch (err) {
    log.error("Failed to save categorization:", err);
  }

  // Cache the result
  const cacheKey = CacheKeys.categorization(session.profileId);
  const responseData = {
    summary: categorization.summary,
    roles: responseRoles,
    categorizationId,
    tokenUsage: {
      model: result.model,
      promptTokens: result.usage?.prompt_tokens || 0,
      completionTokens: result.usage?.completion_tokens || 0,
      totalTokens: result.usage?.total_tokens || 0,
    },
  };
  cache.set(cacheKey, responseData, CacheTTL.CATEGORIZATION);

  trackEvent(session.profileId, "categorization_completed", {
    repoCount: enrichedRepos.length,
    roleCount: responseRoles.length,
    model,
    categorizationId,
  });

  return NextResponse.json(responseData);
}
