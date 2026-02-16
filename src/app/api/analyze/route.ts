import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { structuredCvToMarkdown, createEmptyPersonalDetails } from "@/lib/cv-utils";
import { StructuredCV, ExperienceEntry } from "@/lib/cv-types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_GENERATION_URL = "https://openrouter.ai/api/v1/generation";

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
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key not configured" },
      { status: 500 }
    );
  }

  // Build a comprehensive project summary for the AI
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

  const systemPrompt = `You are an expert career advisor and CV writer. You analyze GitHub repositories to understand a developer's skills and experience, then categorize their projects into distinct career roles and generate tailored, structured CVs for each role.

Your analysis should be thorough and intelligent:
- Look at the languages, frameworks, topics, README content, and project descriptions
- Identify patterns that indicate expertise in specific career domains
- Group related projects under the most fitting career role
- A single project can appear under multiple roles if relevant
- Generate professional, ATS-friendly structured CV data tailored to each role

You MUST respond with valid JSON only, no markdown, no code fences.`;

  const userPrompt = `Analyze the following GitHub profile and repositories, then categorize them into career roles and generate a structured CV for each role.

**User:** ${userName || "GitHub User"}
**Bio:** ${userBio || "Not provided"}

**Repositories (${projectSummaries.length} total):**
${JSON.stringify(projectSummaries, null, 2)}

Respond with the following JSON structure:
{
  "summary": "A brief overview of the developer's overall profile and strengths",
  "roles": [
    {
      "role": "Role Title (e.g., Machine Learning Engineer)",
      "description": "Why this role fits based on the projects",
      "matchingRepoNames": ["repo1", "repo2"],
      "skills": ["skill1", "skill2", "skill3"],
      "structuredCv": {
        "summary": "A 2-3 sentence professional summary tailored for this specific role, highlighting key strengths and experience areas",
        "skills": [
          { "category": "Languages", "items": ["Python", "TypeScript"] },
          { "category": "Frameworks & Libraries", "items": ["React", "TensorFlow"] },
          { "category": "Tools & Platforms", "items": ["Docker", "AWS", "Git"] }
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
            "technologies": ["React", "Node.js", "PostgreSQL"],
            "repoUrl": "https://github.com/user/repo"
          }
        ],
        "education": [],
        "certifications": []
      }
    }
  ]
}

Rules:
- Create between 2-6 roles depending on the diversity of projects
- Each role should have at least 2 matching repos if possible
- The structuredCv must contain detailed, professionally written content
- Each experience entry should have 2-4 achievement-focused bullet points
- Focus on achievements and impact, not just descriptions
- Use strong action verbs and quantify where possible (users, performance, scale)
- Create 2-4 skill categories with relevant items for each role
- Leave education and certifications as empty arrays (user will fill these from their profile)
- Make each CV distinct and optimized for the specific role
- The experience entries should map to the matching repositories
- Include the repo URL in each experience entry's repoUrl field`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "CV Tailor - GitHub Portfolio Analyzer",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter error:", errorData);
      return NextResponse.json(
        { error: "AI analysis failed", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Capture token usage from OpenRouter response
    const usageData = data.usage || {};
    const generationId = data.id;
    const modelUsed =
      data.model || process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response - strip potential markdown code fences
    let parsed;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: content },
        { status: 500 }
      );
    }

    // Map repo names back to full repo objects and normalize structured CV
    const result = {
      summary: parsed.summary,
      roles: parsed.roles.map((role: any) => {
        const matchingRepos = (role.matchingRepoNames || [])
          .map((name: string) =>
            repos.find(
              (r: RepoDetail) =>
                r.name === name || r.full_name === name
            )
          )
          .filter(Boolean);

        // Normalize the structured CV data
        let structuredCv: StructuredCV | undefined;
        if (role.structuredCv) {
          const raw = role.structuredCv;
          structuredCv = {
            personalDetails: createEmptyPersonalDetails(),
            summary: raw.summary || "",
            skills: Array.isArray(raw.skills)
              ? raw.skills.map((s: any) => ({
                  category: s.category || "Other",
                  items: Array.isArray(s.items) ? s.items : [],
                }))
              : [],
            experience: Array.isArray(raw.experience)
              ? raw.experience.map((e: any): ExperienceEntry => ({
                  id: crypto.randomUUID(),
                  title: e.title || "",
                  organization: e.organization || "Personal Project",
                  startDate: e.startDate || "",
                  endDate: e.endDate || "",
                  bullets: Array.isArray(e.bullets) ? e.bullets : [],
                  technologies: Array.isArray(e.technologies) ? e.technologies : [],
                  repoUrl: e.repoUrl || undefined,
                }))
              : [],
            education: [],
            certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
          };
        }

        // Generate markdown from structured CV or use legacy cv field
        const cvMarkdown = structuredCv
          ? structuredCvToMarkdown(structuredCv)
          : role.cv || "";

        return {
          role: role.role,
          description: role.description,
          matchingRepos,
          skills: role.skills,
          cv: cvMarkdown,
          structuredCv,
        };
      }),
    };

    // Save to Supabase if user has a profile
    let sessionId: string | null = null;
    if (session.profileId) {
      try {
        // Create the analysis session
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

          // Insert all generated CVs for this session
          const cvInserts = result.roles.map((role: any) => ({
            session_id: sessionData.id,
            user_id: session.profileId!,
            role_title: role.role,
            role_description: role.description,
            skills: role.skills,
            matching_repos: role.matchingRepos.map((r: RepoDetail) => ({
              name: r.name,
              html_url: r.html_url,
            })),
            cv_content: role.cv,
            structured_cv: role.structuredCv || null,
          }));

          await supabase.from("generated_cvs").insert(cvInserts);
        }

        // Track token usage — fetch exact cost from OpenRouter generation API
        let estimatedCost = 0;
        if (generationId && apiKey) {
          try {
            const genRes = await fetch(
              `${OPENROUTER_GENERATION_URL}?id=${generationId}`,
              {
                headers: { Authorization: `Bearer ${apiKey}` },
              }
            );
            if (genRes.ok) {
              const genData = await genRes.json();
              estimatedCost = genData.data?.total_cost ?? 0;
            }
          } catch {
            // Fall back to 0 cost if generation query fails
          }
        }

        await supabase.from("token_usage").insert({
          user_id: session.profileId,
          session_id: sessionId,
          model: modelUsed,
          prompt_tokens: usageData.prompt_tokens ?? 0,
          completion_tokens: usageData.completion_tokens ?? 0,
          total_tokens: usageData.total_tokens ?? 0,
          estimated_cost_usd: estimatedCost,
        });
      } catch (err) {
        // Log but don't fail the request — the user still gets their CVs
        console.error("Failed to save analysis to Supabase:", err);
      }
    }

    // Include token usage in the response
    const tokenUsage = {
      model: modelUsed,
      promptTokens: usageData.prompt_tokens ?? 0,
      completionTokens: usageData.completion_tokens ?? 0,
      totalTokens: usageData.total_tokens ?? 0,
    };

    return NextResponse.json({ ...result, sessionId, tokenUsage });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze repositories" },
      { status: 500 }
    );
  }
}
