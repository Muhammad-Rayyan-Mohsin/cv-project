import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { structuredCvToMarkdown, createEmptyPersonalDetails } from "@/lib/cv-utils";
import { StructuredCV, ExperienceEntry } from "@/lib/cv-types";
import { Json } from "@/lib/supabase-types";
import { cache, CacheKeys } from "@/lib/cache";
import {
  parseCategorizationXml,
  parseCvXml,
  ParsedCvResponse,
} from "@/lib/xml-parser";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_GENERATION_URL = "https://openrouter.ai/api/v1/generation";

// ---------------------------------------------------------------------------
// Reusable OpenRouter helper
// ---------------------------------------------------------------------------

interface OpenRouterResult {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  generationId: string | null;
  model: string;
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  temperature = 0.7,
  agentName?: string,
): Promise<OpenRouterResult> {
  const model = process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
  const requestBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  console.log(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] Starting API call`);
  console.log(`  Model: ${model}`);
  console.log(`  Max tokens: ${maxTokens}, Temperature: ${temperature}`);
  console.log(`  System prompt length: ${systemPrompt.length} chars`);
  console.log(`  User prompt length: ${userPrompt.length} chars`);

  const startTime = Date.now();
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "CV Tailor - GitHub Portfolio Analyzer",
    },
    body: JSON.stringify(requestBody),
  });

  const elapsedMs = Date.now() - startTime;

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] ❌ API error (${elapsedMs}ms)`);
    console.error(`  Status: ${response.status} ${response.statusText}`);
    console.error(`  Response: ${errorData.slice(0, 500)}`);

    // Parse error to extract more details
    let errorCode = "UNKNOWN";
    let errorMessage = "API request failed";
    try {
      const parsed = JSON.parse(errorData);
      errorCode = parsed.error?.code || response.status;
      errorMessage = parsed.error?.message || parsed.error?.metadata?.raw || errorMessage;
    } catch {
      // If not JSON, use raw error
      errorMessage = errorData;
    }

    // Create a structured error
    const err = new Error(errorMessage) as Error & { code?: number | string; statusCode?: number };
    err.code = errorCode;
    err.statusCode = response.status;
    throw err;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] ❌ No content in response (${elapsedMs}ms)`);
    throw new Error("No response content from AI");
  }

  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  const generationId = data.id || null;
  const returnedModel = data.model || model;

  console.log(`[OpenRouter${agentName ? ` - ${agentName}` : ""}] ✓ Success (${elapsedMs}ms)`);
  console.log(`  Model used: ${returnedModel}`);
  console.log(`  Generation ID: ${generationId}`);
  console.log(`  Token usage: ${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion = ${usage.total_tokens} total`);
  console.log(`  Response length: ${content.length} chars`);

  return {
    content,
    usage,
    generationId,
    model: returnedModel,
  };
}

function cleanXml(raw: string): string {
  return raw.replace(/```xml\n?/g, "").replace(/```\n?/g, "").trim();
}

// ---------------------------------------------------------------------------
// Agent prompts
// ---------------------------------------------------------------------------

const CATEGORIZER_SYSTEM = `You are an expert career advisor. You analyze GitHub repositories to understand a developer's skills and experience, then categorize their projects into distinct career roles.

Your analysis should be thorough and intelligent:
- Look at the languages, frameworks, topics, README content, and project descriptions
- Identify patterns that indicate expertise in specific career domains
- Group related projects under the most fitting career role
- A single project can appear under multiple roles if relevant

You MUST respond with valid XML only. No markdown, no code fences, no prose outside the XML.`;

const CV_WRITER_SYSTEM = `You are an expert CV writer. You generate professional, ATS-friendly structured CV content tailored to a specific career role based on a developer's GitHub projects.

Your writing should:
- Focus on achievements and impact, not just descriptions
- Use strong action verbs and quantify where possible (users, performance, scale)
- Be concise yet detailed — each bullet should demonstrate clear value
- Tailor skill categories and language to the specific career role

You MUST respond with valid XML only. No markdown, no code fences, no prose outside the XML.`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const MAX_REPOS = 50;
  const { repos, userName, userBio } = await request.json();

  if (!repos || !Array.isArray(repos) || repos.length === 0) {
    return NextResponse.json({ error: "No repos provided" }, { status: 400 });
  }

  if (repos.length > MAX_REPOS) {
    return NextResponse.json(
      { error: `Too many repos. Maximum is ${MAX_REPOS}, got ${repos.length}.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 },
    );
  }

  // Build repo summaries for Agent 1 (overview-level, 500 char READMEs)
  const projectSummaries = repos.map((repo: RepoDetail) => ({
    name: repo.name,
    description: repo.description,
    languages: repo.languages,
    topics: repo.topics,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    readme_excerpt: repo.readme?.slice(0, 500) || "No README",
    url: repo.html_url,
    last_updated: repo.pushed_at,
  }));


  try {
    // -----------------------------------------------------------------------
    // AGENT 1 — Categorizer
    // -----------------------------------------------------------------------

    const categorizerPrompt = `Analyze the following GitHub profile and repositories, then categorize them into distinct career roles.

User: ${userName || "GitHub User"}
Bio: ${userBio || "Not provided"}

Repositories (${projectSummaries.length} total):
${JSON.stringify(projectSummaries, null, 2)}

Respond with the following XML structure exactly:

<categorization>
  <summary>A brief overview of the developer's overall profile and strengths</summary>
  <roles>
    <role>
      <title>Role Title (e.g., Machine Learning Engineer)</title>
      <description>Why this role fits based on the projects</description>
      <matchingRepoNames>
        <repo>repo1</repo>
        <repo>repo2</repo>
      </matchingRepoNames>
      <skills>
        <skill>skill1</skill>
        <skill>skill2</skill>
        <skill>skill3</skill>
      </skills>
    </role>
  </roles>
</categorization>

Rules:
- Create between 2-6 roles depending on the diversity of projects
- **CRITICAL**: Each repository must be assigned to ONLY ONE role based on its primary category/domain
- A repository cannot appear in multiple roles' matchingRepoNames
- Match repositories to roles by their primary technology stack and purpose
- A role CAN have multiple repositories if they all fit that category
- Each role should have at least 1 matching repo
- List 3-8 top skills per role (technologies, frameworks, concepts)
- Do NOT generate CVs — only categorize projects into roles
- Escape special XML characters: & as &amp; < as &lt; > as &gt;

Example: If there are 5 repos (ai-model, ml-pipeline, react-app, vue-dashboard, mobile-app):
✓ CORRECT categorization:
- AI/ML Engineer: ["ai-model", "ml-pipeline"] ← Multiple AI projects in AI role
- Frontend Developer: ["react-app", "vue-dashboard"] ← Multiple web projects in web role
- Mobile Developer: ["mobile-app"] ← One mobile project
✗ WRONG: DO NOT assign "react-app" to AI/ML Engineer role
✗ WRONG: DO NOT assign "ai-model" to Frontend Developer role`;

    console.log("\n========================================");
    console.log("ANALYSIS PIPELINE START");
    console.log("========================================");
    console.log(`User: ${userName || "GitHub User"}`);
    console.log(`Repositories: ${repos.length}`);
    console.log(`Selected model: ${process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview"}`);

    let agent1Result: OpenRouterResult;
    try {
      console.log("\n--- AGENT 1: CATEGORIZER ---");
      agent1Result = await callOpenRouter(apiKey, CATEGORIZER_SYSTEM, categorizerPrompt, 4000, 0.5, "Categorizer");
    } catch (err: any) {
      console.error("\n❌ Agent 1 (Categorizer) failed:", err);

      // Check for rate limit or insufficient credits
      if (err.statusCode === 429) {
        return NextResponse.json(
          {
            error: "Rate limited",
            errorType: "RATE_LIMIT",
            message: err.message || "The AI service is temporarily rate-limited. Please try again in a few moments."
          },
          { status: 429 },
        );
      }

      if (err.statusCode === 402 || err.code === 402) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            errorType: "NO_CREDITS",
            message: "Sorry, we're out of credits :("
          },
          { status: 402 },
        );
      }

      return NextResponse.json(
        {
          error: "AI analysis failed during categorization",
          errorType: "ANALYSIS_FAILED",
          message: err.message || "AI analysis failed during categorization"
        },
        { status: 500 },
      );
    }

    const categorization = parseCategorizationXml(cleanXml(agent1Result.content));

    console.log(`\n✓ Categorization complete: ${categorization.roles.length} roles identified`);
    categorization.roles.forEach((role, i) => {
      console.log(`  ${i + 1}. ${role.title} (${role.matchingRepoNames.length} repos)`);
    });

    // -----------------------------------------------------------------------
    // AGENT 2 — CV Writer (parallel, one per role)
    // -----------------------------------------------------------------------

    console.log("\n--- AGENT 2: CV WRITERS (parallel) ---");

    type CvSuccess = {
      success: true;
      parsedCv: ParsedCvResponse;
      usage: OpenRouterResult["usage"];
      generationId: string | null;
    };
    type CvFailure = { success: false; error: unknown };
    type CvResult = CvSuccess | CvFailure;

    const cvPromises: Promise<CvResult>[] = categorization.roles.map(async (catRole) => {
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
        readme_excerpt: repo.readme?.slice(0, 2000) || "No README",
        url: repo.html_url,
        last_updated: repo.pushed_at,
      }));

      const cvPrompt = `Generate a structured CV for the following career role based on these GitHub repositories.

Role: ${catRole.title}
Role Description: ${catRole.description}
Top Skills: ${catRole.skills.join(", ")}
User: ${userName || "GitHub User"}

Repositories (${focusedSummaries.length} total):
${JSON.stringify(focusedSummaries, null, 2)}

Respond with the following XML structure exactly:

<cv>
  <summary>A 2-3 sentence professional summary tailored for ${catRole.title}</summary>
  <skillCategories>
    <category>
      <name>Languages</name>
      <items>
        <item>Python</item>
        <item>TypeScript</item>
      </items>
    </category>
    <category>
      <name>Frameworks &amp; Libraries</name>
      <items>
        <item>React</item>
        <item>TensorFlow</item>
      </items>
    </category>
  </skillCategories>
  <experience>
    <entry>
      <title>Project Name</title>
      <organization>Personal Project</organization>
      <startDate>2023</startDate>
      <endDate>Present</endDate>
      <bullets>
        <bullet>Built X using Y, resulting in Z improvement</bullet>
        <bullet>Implemented A that handled B concurrent users</bullet>
      </bullets>
      <technologies>
        <tech>React</tech>
        <tech>Node.js</tech>
      </technologies>
      <repoUrl>https://github.com/user/repo</repoUrl>
    </entry>
  </experience>
</cv>

Rules:
- Each experience entry should have 2-4 achievement-focused bullet points
- Focus on achievements and impact, not just descriptions
- Use strong action verbs and quantify where possible (users, performance, scale)
- Create 2-4 skill categories with relevant items for this role
- The experience entries should map to the repositories provided
- Include the repo URL in each experience entry's repoUrl element
- Do NOT include education, certifications, or work experience (user fills these from their profile)
- Escape special XML characters: & as &amp; < as &lt; > as &gt;`;

      try {
        const result = await callOpenRouter(apiKey, CV_WRITER_SYSTEM, cvPrompt, 8000, 0.7, `CV Writer - ${catRole.title}`);
        const parsedCv = parseCvXml(cleanXml(result.content));
        return { success: true as const, parsedCv, usage: result.usage, generationId: result.generationId };
      } catch (err) {
        console.error(`\n❌ Agent 2 (CV Writer) failed for role "${catRole.title}":`, err);
        return { success: false as const, error: err };
      }
    });

    const cvResults = await Promise.all(cvPromises);

    const successCount = cvResults.filter((r) => r.success).length;
    const failCount = cvResults.filter((r) => !r.success).length;
    console.log(`\n✓ CV generation complete: ${successCount} succeeded, ${failCount} failed`);

    // If every CV generation failed, bail out
    if (cvResults.every((r) => !r.success)) {
      console.error("\n❌ All CV generations failed");
      return NextResponse.json(
        { error: "AI failed to generate any CVs. Please try again." },
        { status: 500 },
      );
    }

    // -----------------------------------------------------------------------
    // Assemble final result (same shape as before)
    // -----------------------------------------------------------------------

    const modelUsed = agent1Result.model;

    const result = {
      summary: categorization.summary,
      roles: categorization.roles.map((catRole, index) => {
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
      agent1Result.usage,
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

    console.log("\n--- TOKEN USAGE SUMMARY ---");
    console.log(`Total API calls: ${allUsages.length} (1 categorizer + ${allUsages.length - 1} CV writers)`);
    console.log(`Aggregated tokens: ${aggregatedUsage.prompt_tokens} prompt + ${aggregatedUsage.completion_tokens} completion = ${aggregatedUsage.total_tokens} total`);

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

        // Fetch cost from all generation IDs.
        // OpenRouter populates cost data asynchronously — wait briefly
        // then retry once if the first attempt returns 0.
        const allGenerationIds = [
          agent1Result.generationId,
          ...cvResults.filter((r): r is CvSuccess => r.success).map((r) => r.generationId),
        ].filter(Boolean) as string[];

        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
        await delay(3000);

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
            if (attempt === 0) await delay(2000);
          }
          return 0;
        }

        console.log(`\n--- COST TRACKING ---`);
        console.log(`Generation IDs to query: ${allGenerationIds.length}`);

        let totalCost = 0;
        const costs = await Promise.all(allGenerationIds.map(fetchCost));
        totalCost = costs.reduce((sum, c) => sum + c, 0);

        console.log(`Total cost: $${totalCost.toFixed(6)}`);
        if (totalCost === 0) {
          console.warn("⚠️  Cost is $0 — OpenRouter may not have populated cost data yet");
        }

        await supabase.from("token_usage").insert({
          user_id: session.profileId,
          session_id: sessionId,
          model: modelUsed,
          prompt_tokens: aggregatedUsage.prompt_tokens,
          completion_tokens: aggregatedUsage.completion_tokens,
          total_tokens: aggregatedUsage.total_tokens,
          estimated_cost_usd: totalCost,
        });

        cache.delete(CacheKeys.history(session.profileId!));
        cache.delete(CacheKeys.usage(session.profileId!));

        console.log("✓ Saved to Supabase and invalidated caches");
      } catch (err) {
        console.error("\n❌ Failed to save analysis to Supabase:", err);
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

    console.log("\n========================================");
    console.log("ANALYSIS PIPELINE COMPLETE ✓");
    console.log("========================================\n");

    return NextResponse.json({ ...result, sessionId, tokenUsage });
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ ANALYSIS PIPELINE FAILED");
    console.error("========================================");
    console.error("Error:", error);
    console.error("========================================\n");
    return NextResponse.json(
      { error: "Failed to analyze repositories" },
      { status: 500 },
    );
  }
}
