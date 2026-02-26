import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { structuredCvToMarkdown, createEmptyPersonalDetails } from "@/lib/cv-utils";
import { StructuredCV, ExperienceEntry } from "@/lib/cv-types";
import { Json } from "@/lib/supabase-types";
import { cache, CacheKeys } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import { AnalyzeRequestSchema, GenerateCVsRequestSchema } from "@/lib/validation";
import { trackEvent } from "@/lib/tracking";
import {
  parseCategorizationJson,
  parseCvJson,
  ParsedCvResponse,
} from "@/lib/xml-parser";
import {
  callOpenRouter,
  CV_WRITER_SYSTEM,
  CATEGORIZER_SYSTEM,
  sanitizeUserContent,
  wrapUserData,
  enrichReposWithReadmes,
  fetchAndRecordCosts,
  log,
  OpenRouterResult,
} from "@/lib/ai-helpers";

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 5 analyses per hour
  if (session.profileId) {
    const { success, remaining } = rateLimit(session.profileId, 5, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 analyses per hour.", remaining },
        { status: 429 },
      );
    }
  }

  // Parse and validate request body

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 },
    );
  }

  // Fetch READMEs server-side for selected repos (lazy-loaded)
  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json(
      { error: "No GitHub access token" },
      { status: 401 },
    );
  }

  // ---------------------------------------------------------------------------
  // Determine request format: new (pre-categorized) vs legacy
  // ---------------------------------------------------------------------------

  const bodyObj = body as Record<string, unknown>;
  const hasCategories = Array.isArray(bodyObj?.categories);

  let repos: RepoDetail[];
  let userName: string | undefined;
  let userBio: string | undefined;

  interface CategorizedRole {
    title: string;
    description: string;
    matchingRepoNames: string[];
    skills: string[];
  }

  let categorizedRoles: CategorizedRole[];
  let categorizationSummary: string;
  let agent1Result: OpenRouterResult | null = null;

  if (hasCategories) {
    // -----------------------------------------------------------------
    // NEW FLOW: categories already provided (pre-categorized)
    // -----------------------------------------------------------------

    const parsed = GenerateCVsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    repos = parsed.data.repos as RepoDetail[];
    userName = parsed.data.userName;
    userBio = parsed.data.userBio;

    log.info(`[Analyze] Pre-categorized flow: ${parsed.data.categories.length} categories, ${repos.length} repos`);

    // Enrich repos with READMEs
    log.info(`Fetching READMEs for ${repos.length} selected repos...`);
    repos = await enrichReposWithReadmes(accessToken, repos);
    log.info("README enrichment complete");

    categorizedRoles = parsed.data.categories.map((cat) => ({
      title: cat.title,
      description: cat.description,
      matchingRepoNames: cat.repoNames,
      skills: cat.skills,
    }));

    // Use a summary from the categories or a generic one
    categorizationSummary = `Pre-categorized analysis with ${categorizedRoles.length} roles`;
  } else {
    // -----------------------------------------------------------------
    // LEGACY FLOW: run categorization inline (backwards compat)
    // -----------------------------------------------------------------

    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { repos: rawRepos, userName: uName, userBio: uBio } = parseResult.data;
    userName = uName;
    userBio = uBio;

    log.info(`Fetching READMEs for ${(rawRepos as RepoDetail[]).length} selected repos...`);
    repos = await enrichReposWithReadmes(accessToken, rawRepos as RepoDetail[]);
    log.info("README enrichment complete");

    // Build repo summaries for Agent 1 (overview-level, 500 char READMEs)
    const projectSummaries = repos.map((repo: RepoDetail) => ({
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

    // Collect repo names for validation against AI output
    const validRepoNames = new Set(repos.map((r: RepoDetail) => r.name));
    const validFullNames = new Set(repos.map((r: RepoDetail) => r.full_name));

    const sanitizedUserName = wrapUserData(userName || "GitHub User", 100);
    const sanitizedUserBio = wrapUserData(userBio || "Not provided", 500);

    const categorizerPrompt = `Analyze the following GitHub profile and repositories, then categorize them into distinct career roles.

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

    log.info("========================================");
    log.info("ANALYSIS PIPELINE START (legacy flow)");
    log.info(`User: ${userName || "GitHub User"}, Repositories: ${repos.length}`);

    try {
      log.info("--- AGENT 1: CATEGORIZER ---");
      agent1Result = await callOpenRouter(apiKey, CATEGORIZER_SYSTEM, categorizerPrompt, 4000, 0.5, "Categorizer");
    } catch (err: unknown) {
      const apiErr = err as Error & { statusCode?: number; code?: number | string };
      log.error("Agent 1 (Categorizer) failed:", apiErr);

      if (apiErr.statusCode === 429) {
        return NextResponse.json(
          {
            error: "Rate limited",
            errorType: "RATE_LIMIT",
            message: apiErr.message || "The AI service is temporarily rate-limited. Please try again in a few moments.",
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
          error: "AI analysis failed during categorization",
          errorType: "ANALYSIS_FAILED",
          message: apiErr.message || "AI analysis failed during categorization",
        },
        { status: 500 },
      );
    }

    const categorization = parseCategorizationJson(agent1Result.content);

    // Validate that AI-returned repo names match actual input repos
    for (const role of categorization.roles) {
      const originalNames = [...role.matchingRepoNames];
      role.matchingRepoNames = role.matchingRepoNames.filter((name) => {
        if (validRepoNames.has(name) || validFullNames.has(name)) return true;
        log.warn(`Hallucinated repo name "${name}" in role "${role.title}" -- removing`);
        return false;
      });
      if (role.matchingRepoNames.length < originalNames.length) {
        log.warn(
          `Role "${role.title}": ${originalNames.length - role.matchingRepoNames.length} hallucinated repo(s) removed`,
        );
      }
    }

    log.info(`Categorization complete: ${categorization.roles.length} roles identified`);
    categorization.roles.forEach((role, i) => {
      log.info(`  ${i + 1}. ${role.title} (${role.matchingRepoNames.length} repos)`);
    });

    categorizedRoles = categorization.roles;
    categorizationSummary = categorization.summary;
  }

  // -----------------------------------------------------------------------
  // Track analysis start
  // -----------------------------------------------------------------------

  trackEvent(session.profileId ?? null, "analysis_started", { repoCount: repos.length });

  try {
    // -----------------------------------------------------------------------
    // AGENT 2 -- CV Writer (parallel, one per role)
    // -----------------------------------------------------------------------

    log.info("--- AGENT 2: CV WRITERS (parallel) ---");

    const sanitizedUserName = wrapUserData(
      sanitizeUserContent(userName || "GitHub User"),
      100,
    );

    type CvSuccess = {
      success: true;
      parsedCv: ParsedCvResponse;
      usage: OpenRouterResult["usage"];
      generationId: string | null;
    };
    type CvFailure = { success: false; error: unknown };
    type CvResult = CvSuccess | CvFailure;

    const cvPromises: Promise<CvResult>[] = categorizedRoles.map(async (catRole) => {
      // Resolve full repo objects for this role (expanded READMEs for deeper context)
      const roleRepos = catRole.matchingRepoNames
        .map((name) =>
          repos.find((r: RepoDetail) => r.name === name || r.full_name === name),
        )
        .filter(Boolean) as RepoDetail[];

      const focusedSummaries = roleRepos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        languages: repo.languages,
        topics: repo.topics,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        readme_excerpt: wrapUserData(repo.readme?.slice(0, 2000) || "No README", 2000),
        url: repo.html_url,
        last_updated: repo.pushed_at,
      }));

      const cvPrompt = `Generate a structured CV for the following career role based on these GitHub repositories.

Role: ${wrapUserData(catRole.title, 200)}
Role Description: ${wrapUserData(catRole.description, 500)}
Top Skills: ${catRole.skills.join(", ")}
User: ${sanitizedUserName}

Repositories (${focusedSummaries.length} total):
${JSON.stringify(focusedSummaries, null, 2)}

Respond with the following JSON structure exactly:

{
  "summary": "A 2-3 sentence professional summary tailored for ${catRole.title}",
  "skills": [
    {
      "category": "Languages",
      "items": ["Python", "TypeScript"]
    },
    {
      "category": "Frameworks & Libraries",
      "items": ["React", "TensorFlow"]
    }
  ],
  "experience": [
    {
      "title": "Project Name",
      "organization": "Personal Project",
      "startDate": "2023",
      "endDate": "Present",
      "bullets": [
        "Built X using Y, resulting in Z improvement",
        "Implemented A that handled B concurrent users"
      ],
      "technologies": ["React", "Node.js"],
      "repoUrl": "https://github.com/user/repo"
    }
  ],
  "certifications": []
}

Rules:
- Each experience entry should have 2-4 achievement-focused bullet points
- Focus on achievements and impact, not just descriptions
- Use strong action verbs and quantify where possible (users, performance, scale)
- Create 2-4 skill categories with relevant items for this role
- The experience entries should map to the repositories provided
- Include the repo URL in each experience entry's repoUrl field
- Do NOT include education, certifications, or work experience (user fills these from their profile)`;

      try {
        const result = await callOpenRouter(apiKey, CV_WRITER_SYSTEM, cvPrompt, 8000, 0.7, `CV Writer - ${catRole.title}`);
        const parsedCv = parseCvJson(result.content);
        return { success: true as const, parsedCv, usage: result.usage, generationId: result.generationId };
      } catch (err) {
        log.error(`Agent 2 (CV Writer) failed for role "${catRole.title}":`, err);
        return { success: false as const, error: err };
      }
    });

    const cvResults = await Promise.all(cvPromises);

    const successCount = cvResults.filter((r) => r.success).length;
    const failCount = cvResults.filter((r) => !r.success).length;
    log.info(`CV generation complete: ${successCount} succeeded, ${failCount} failed`);

    // If every CV generation failed, bail out
    if (cvResults.every((r) => !r.success)) {
      log.error("All CV generations failed");
      return NextResponse.json(
        { error: "AI failed to generate any CVs. Please try again." },
        { status: 500 },
      );
    }

    // -----------------------------------------------------------------------
    // Assemble final result (same shape as before)
    // -----------------------------------------------------------------------

    const modelUsed = agent1Result?.model || process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    const result = {
      summary: categorizationSummary,
      roles: categorizedRoles.map((catRole, index) => {
        const cvResult = cvResults[index];

        // Full repo objects for this role
        const matchingRepos = catRole.matchingRepoNames
          .map((name) =>
            repos.find((r: RepoDetail) => r.name === name || r.full_name === name),
          )
          .filter(Boolean);

        // Build StructuredCV from Agent 2 output (if it succeeded)
        let structuredCv: StructuredCV | undefined;
        let cvMarkdown = "";

        if (cvResult.success) {
          const raw = cvResult.parsedCv;
          structuredCv = {
            personalDetails: createEmptyPersonalDetails(),
            summary: raw.summary || "",
            skills: raw.skills.map((s) => ({
              category: s.category || "Other",
              items: Array.isArray(s.items) ? s.items : [],
            })),
            experience: raw.experience.map((e): ExperienceEntry => ({
              id: crypto.randomUUID(),
              title: e.title || "",
              organization: e.organization || "Personal Project",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              bullets: Array.isArray(e.bullets) ? e.bullets : [],
              technologies: Array.isArray(e.technologies) ? e.technologies : [],
              repoUrl: e.repoUrl || undefined,
            })),
            education: [],
            certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
          };
          cvMarkdown = structuredCvToMarkdown(structuredCv);
        }

        return {
          role: catRole.title,
          description: catRole.description,
          matchingRepos,
          skills: catRole.skills,
          cv: cvMarkdown,
          structuredCv,
        };
      }),
    };

    // -----------------------------------------------------------------------
    // Aggregate token usage across all agent calls
    // -----------------------------------------------------------------------

    const allUsages = [
      ...(agent1Result ? [agent1Result.usage] : []),
      ...cvResults.filter((r): r is CvSuccess => r.success).map((r) => r.usage),
    ];

    const aggregatedUsage = allUsages.reduce(
      (acc, u) => ({
        prompt_tokens: acc.prompt_tokens + (u.prompt_tokens ?? 0),
        completion_tokens: acc.completion_tokens + (u.completion_tokens ?? 0),
        total_tokens: acc.total_tokens + (u.total_tokens ?? 0),
      }),
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    );

    log.info("--- TOKEN USAGE SUMMARY ---");
    log.info(`Total API calls: ${allUsages.length} (${agent1Result ? "1 categorizer + " : ""}${allUsages.length - (agent1Result ? 1 : 0)} CV writers)`);
    log.info(`Aggregated tokens: ${aggregatedUsage.prompt_tokens} prompt + ${aggregatedUsage.completion_tokens} completion = ${aggregatedUsage.total_tokens} total`);

    // -----------------------------------------------------------------------
    // Save to Supabase
    // -----------------------------------------------------------------------

    let sessionId: string | null = null;
    if (session.profileId) {
      try {
        const { data: sessionData } = await supabase
          .from("analysis_sessions")
          .insert({
            user_id: session.profileId,
            selected_repos: repos.map((r: RepoDetail) => ({
              name: r.name,
              full_name: r.full_name,
              html_url: r.html_url,
            })),
            summary: result.summary,
            status: "completed",
          })
          .select("id")
          .single();

        if (sessionData) {
          sessionId = sessionData.id;

          const cvInserts = result.roles.map((role) => ({
            session_id: sessionData.id,
            user_id: session.profileId!,
            role_title: role.role,
            role_description: role.description,
            skills: role.skills,
            matching_repos: (role.matchingRepos as RepoDetail[]).map((r) => ({
              name: r.name,
              html_url: r.html_url,
            })),
            cv_content: role.cv,
            structured_cv: (role.structuredCv as unknown as Json) || null,
          }));

          await supabase.from("generated_cvs").insert(cvInserts);
        }

        // Fire and forget cost tracking -- don't block the response
        const allGenerationIds = [
          ...(agent1Result ? [agent1Result.generationId] : []),
          ...cvResults.filter((r): r is CvSuccess => r.success).map((r) => r.generationId),
        ].filter(Boolean) as string[];

        fetchAndRecordCosts(
          allGenerationIds,
          sessionId,
          session.profileId,
          modelUsed,
          aggregatedUsage,
          apiKey,
        ).catch((err) => log.warn("Background cost tracking failed:", err));

        cache.delete(CacheKeys.history(session.profileId!));

        log.info("Saved to Supabase and invalidated caches");
        trackEvent(session.profileId ?? null, "analysis_completed", {
          repoCount: repos.length,
          roleCount: result.roles.length,
          sessionId,
        });
      } catch (err) {
        log.error("Failed to save analysis to Supabase:", err);
      }
    }

    // -----------------------------------------------------------------------
    // Return response (unchanged shape)
    // -----------------------------------------------------------------------

    const tokenUsage = {
      model: modelUsed,
      promptTokens: aggregatedUsage.prompt_tokens,
      completionTokens: aggregatedUsage.completion_tokens,
      totalTokens: aggregatedUsage.total_tokens,
    };

    log.info("ANALYSIS PIPELINE COMPLETE");

    return NextResponse.json({ ...result, sessionId, tokenUsage });
  } catch (error) {
    log.error("ANALYSIS PIPELINE FAILED:", error);
    trackEvent(session.profileId ?? null, "analysis_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message = error instanceof Error ? error.message : "Failed to analyze repositories";
    return NextResponse.json(
      { error: "Failed to analyze repositories", errorType: "PIPELINE_ERROR", message },
      { status: 500 },
    );
  }
}
