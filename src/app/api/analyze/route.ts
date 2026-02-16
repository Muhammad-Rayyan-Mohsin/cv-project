import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { supabase } from "@/lib/supabase";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  const systemPrompt = `You are an expert career advisor and CV writer. You analyze GitHub repositories to understand a developer's skills and experience, then categorize their projects into distinct career roles and generate tailored CVs for each role.

Your analysis should be thorough and intelligent:
- Look at the languages, frameworks, topics, README content, and project descriptions
- Identify patterns that indicate expertise in specific career domains
- Group related projects under the most fitting career role
- A single project can appear under multiple roles if relevant
- Generate professional, ATS-friendly CVs tailored to each role

You MUST respond with valid JSON only, no markdown, no code fences.`;

  const userPrompt = `Analyze the following GitHub profile and repositories, then categorize them into career roles and generate a tailored CV for each role.

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
      "cv": "A complete, professional CV/resume tailored for this role in markdown format. Include sections: Professional Summary, Technical Skills, Project Experience (using the matching repos with descriptions of what was built, technologies used, and impact), Education placeholder, and any relevant certifications placeholder. Make it detailed and ready to use."
    }
  ]
}

Rules:
- Create between 2-6 roles depending on the diversity of projects
- Each role should have at least 2 matching repos if possible
- The CV should be detailed (at least 300 words) and professionally written
- Focus on achievements and impact, not just descriptions
- Use action verbs and quantify where possible
- Make each CV distinct and optimized for the specific role
- Include relevant technical skills for each role`;

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

    // Map repo names back to full repo objects
    const result = {
      summary: parsed.summary,
      roles: parsed.roles.map((role: any) => ({
        role: role.role,
        description: role.description,
        matchingRepos: (role.matchingRepoNames || [])
          .map((name: string) =>
            repos.find(
              (r: RepoDetail) =>
                r.name === name || r.full_name === name
            )
          )
          .filter(Boolean),
        skills: role.skills,
        cv: role.cv,
      })),
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
          }));

          await supabase.from("generated_cvs").insert(cvInserts);
        }
      } catch (err) {
        // Log but don't fail the request — the user still gets their CVs
        console.error("Failed to save analysis to Supabase:", err);
      }
    }

    return NextResponse.json({ ...result, sessionId });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze repositories" },
      { status: 500 }
    );
  }
}
