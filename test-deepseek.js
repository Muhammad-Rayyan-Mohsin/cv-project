#!/usr/bin/env node

/**
 * Test script to verify DeepSeek R1 free model works with our XML prompts
 * Usage: node test-deepseek.js
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const MODEL = "deepseek/deepseek-r1-0528:free";

const systemPrompt = `You are an expert career advisor. You analyze GitHub repositories to understand a developer's skills and experience, then categorize their projects into distinct career roles.

Your analysis should be thorough and intelligent:
- Look at the languages, frameworks, topics, README content, and project descriptions
- Identify patterns that indicate expertise in specific career domains
- Group related projects under the most fitting career role
- A single project can appear under multiple roles if relevant

You MUST respond with valid XML only. No markdown, no code fences, no prose outside the XML.`;

const userPrompt = `Analyze the following GitHub profile and repositories, then categorize them into career roles.

User: Test Developer
Bio: Full-stack developer passionate about open source

Repositories (2 total):
[
  {
    "name": "react-dashboard",
    "description": "Modern admin dashboard built with React and TypeScript",
    "languages": ["TypeScript", "JavaScript", "CSS"],
    "topics": ["react", "dashboard", "typescript"],
    "stars": 45,
    "forks": 12,
    "readme_excerpt": "A beautiful admin dashboard with chart visualizations and real-time updates. Built with React 18, TypeScript, and Tailwind CSS.",
    "url": "https://github.com/user/react-dashboard",
    "last_updated": "2024-02-15T10:30:00Z"
  },
  {
    "name": "python-ml-toolkit",
    "description": "Machine learning utilities and helper functions",
    "languages": ["Python", "Jupyter Notebook"],
    "topics": ["machine-learning", "python", "data-science"],
    "stars": 120,
    "forks": 30,
    "readme_excerpt": "Collection of ML utilities for data preprocessing, model evaluation, and visualization. Includes examples with scikit-learn and TensorFlow.",
    "url": "https://github.com/user/python-ml-toolkit",
    "last_updated": "2024-02-10T14:20:00Z"
  }
]

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
- Create between 2-3 roles depending on the diversity of projects
- Each role should have at least 1 matching repo
- List 3-5 top skills per role
- Do NOT generate CVs — only categorize projects into roles
- Escape special XML characters: & as &amp; < as &lt; > as &gt;`;

async function testDeepSeek() {
  console.log("========================================");
  console.log("DEEPSEEK R1 FREE MODEL TEST");
  console.log("========================================\n");

  console.log("Model:", MODEL);
  console.log("API Key:", OPENROUTER_API_KEY.slice(0, 20) + "...");
  console.log("\nSending request...\n");

  const startTime = Date.now();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CV Tailor Test Script",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 4000,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:");
      console.error("Status:", response.status, response.statusText);
      console.error("Response:", errorText);
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const usage = data.usage || {};

    console.log("✅ SUCCESS\n");
    console.log("Elapsed time:", elapsed + "ms");
    console.log("Model used:", data.model || MODEL);
    console.log("Generation ID:", data.id || "N/A");
    console.log("\nToken usage:");
    console.log("  Prompt tokens:", usage.prompt_tokens || 0);
    console.log("  Completion tokens:", usage.completion_tokens || 0);
    console.log("  Total tokens:", usage.total_tokens || 0);

    console.log("\n========================================");
    console.log("RESPONSE CONTENT");
    console.log("========================================\n");

    if (!content) {
      console.error("❌ No content in response");
      process.exit(1);
    }

    // Clean XML response
    const cleanedXml = content
      .replace(/```xml\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log(cleanedXml);

    // Try to parse it
    console.log("\n========================================");
    console.log("XML PARSING TEST");
    console.log("========================================\n");

    const summaryMatch = cleanedXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
    const rolesMatch = cleanedXml.match(/<roles[^>]*>([\s\S]*?)<\/roles>/i);

    if (summaryMatch) {
      console.log("✅ Found <summary> tag");
      console.log("   Content:", summaryMatch[1].trim().slice(0, 80) + "...");
    } else {
      console.log("❌ Missing <summary> tag");
    }

    if (rolesMatch) {
      const roleCount = (rolesMatch[1].match(/<role[^>]*>/gi) || []).length;
      console.log("✅ Found <roles> tag with", roleCount, "role(s)");
    } else {
      console.log("❌ Missing <roles> tag");
    }

    console.log("\n========================================");
    console.log("TEST COMPLETE");
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Request failed:");
    console.error(error.message);
    process.exit(1);
  }
}

testDeepSeek();
