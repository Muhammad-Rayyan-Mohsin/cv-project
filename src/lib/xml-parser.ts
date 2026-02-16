/**
 * Lightweight XML parser for the AI analysis response.
 *
 * We avoid heavy XML libraries by using simple regex helpers.
 * The AI is instructed to return a well-defined XML schema so we can
 * extract elements reliably without a full DOM parser.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the text content of the first occurrence of <tag>…</tag>. */
function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
}

/** Extract ALL occurrences of <tag>…</tag> and return their inner text. */
function getAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

/** Unescape common XML entities back to plain text. */
function unescapeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ---------------------------------------------------------------------------
// Public parser
// ---------------------------------------------------------------------------

export interface ParsedAnalysis {
  summary: string;
  roles: ParsedRole[];
}

export interface ParsedRole {
  role: string;
  description: string;
  matchingRepoNames: string[];
  skills: string[];
  structuredCv?: {
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
  };
}

/**
 * Parse the XML response from the AI into a structured object that the
 * analyze route can consume.
 *
 * Expected XML schema:
 * ```xml
 * <analysis>
 *   <summary>…</summary>
 *   <roles>
 *     <role>
 *       <title>…</title>
 *       <description>…</description>
 *       <matchingRepoNames><repo>…</repo></matchingRepoNames>
 *       <skills><skill>…</skill></skills>
 *       <structuredCv>
 *         <summary>…</summary>
 *         <skillCategories>
 *           <category><name>…</name><items><item>…</item></items></category>
 *         </skillCategories>
 *         <experience>
 *           <entry>…</entry>
 *         </experience>
 *       </structuredCv>
 *     </role>
 *   </roles>
 * </analysis>
 * ```
 */
export function parseAnalysisXml(xml: string): ParsedAnalysis {
  const analysisBlock = getTag(xml, "analysis") || xml;
  const summary = unescapeXml(getTag(analysisBlock, "summary"));

  // Extract each <role>…</role> block
  const roleBlocks = getAllTags(getTag(analysisBlock, "roles") || analysisBlock, "role");

  const roles: ParsedRole[] = roleBlocks.map((block) => {
    const title = unescapeXml(getTag(block, "title"));
    const description = unescapeXml(getTag(block, "description"));

    // Matching repo names
    const repoNamesBlock = getTag(block, "matchingRepoNames");
    const matchingRepoNames = getAllTags(repoNamesBlock, "repo").map(unescapeXml);

    // Skills list
    const skillsBlock = getTag(block, "skills");
    const skills = getAllTags(skillsBlock, "skill").map(unescapeXml);

    // Structured CV
    let structuredCv: ParsedRole["structuredCv"] = undefined;
    const cvBlock = getTag(block, "structuredCv");
    if (cvBlock) {
      const cvSummary = unescapeXml(getTag(cvBlock, "summary"));

      // Skill categories
      const categoriesBlock = getTag(cvBlock, "skillCategories");
      const categoryBlocks = getAllTags(categoriesBlock, "category");
      const cvSkills = categoryBlocks.map((cat) => ({
        category: unescapeXml(getTag(cat, "name")),
        items: getAllTags(getTag(cat, "items"), "item").map(unescapeXml),
      }));

      // Experience entries
      const experienceBlock = getTag(cvBlock, "experience");
      const entryBlocks = getAllTags(experienceBlock, "entry");
      const experience = entryBlocks.map((entry) => ({
        title: unescapeXml(getTag(entry, "title")),
        organization: unescapeXml(getTag(entry, "organization")),
        startDate: unescapeXml(getTag(entry, "startDate")),
        endDate: unescapeXml(getTag(entry, "endDate")),
        bullets: getAllTags(getTag(entry, "bullets"), "bullet").map(unescapeXml),
        technologies: getAllTags(getTag(entry, "technologies"), "tech").map(unescapeXml),
        repoUrl: unescapeXml(getTag(entry, "repoUrl")),
      }));

      // Certifications (may be empty)
      const certsBlock = getTag(cvBlock, "certifications");
      const certifications = certsBlock
        ? getAllTags(certsBlock, "cert").map(unescapeXml)
        : [];

      structuredCv = {
        summary: cvSummary,
        skills: cvSkills,
        experience,
        certifications,
      };
    }

    return {
      role: title,
      description,
      matchingRepoNames,
      skills,
      structuredCv,
    };
  });

  if (roles.length === 0) {
    throw new Error("No <role> elements found in AI XML response");
  }

  return { summary, roles };
}

// ---------------------------------------------------------------------------
// Agent 1 — Categorization parser
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
 * Parse the Agent 1 (Categorizer) XML response.
 *
 * Expected schema:
 * ```xml
 * <categorization>
 *   <summary>…</summary>
 *   <roles>
 *     <role>
 *       <title>…</title>
 *       <description>…</description>
 *       <matchingRepoNames><repo>…</repo></matchingRepoNames>
 *       <skills><skill>…</skill></skills>
 *     </role>
 *   </roles>
 * </categorization>
 * ```
 */
export function parseCategorizationXml(xml: string): ParsedCategorization {
  const outer = getTag(xml, "categorization") || xml;
  const summary = unescapeXml(getTag(outer, "summary"));

  const roleBlocks = getAllTags(getTag(outer, "roles") || outer, "role");

  const roles = roleBlocks.map((block) => ({
    title: unescapeXml(getTag(block, "title")),
    description: unescapeXml(getTag(block, "description")),
    matchingRepoNames: getAllTags(getTag(block, "matchingRepoNames"), "repo").map(unescapeXml),
    skills: getAllTags(getTag(block, "skills"), "skill").map(unescapeXml),
  }));

  if (roles.length === 0) {
    throw new Error("No <role> elements found in categorization XML");
  }

  return { summary, roles };
}

// ---------------------------------------------------------------------------
// Agent 2 — CV writer parser
// ---------------------------------------------------------------------------

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
 * Parse the Agent 2 (CV Writer) XML response for a single role.
 *
 * Expected schema:
 * ```xml
 * <cv>
 *   <summary>…</summary>
 *   <skillCategories>
 *     <category><name>…</name><items><item>…</item></items></category>
 *   </skillCategories>
 *   <experience>
 *     <entry>
 *       <title>…</title>
 *       <organization>…</organization>
 *       <startDate>…</startDate>
 *       <endDate>…</endDate>
 *       <bullets><bullet>…</bullet></bullets>
 *       <technologies><tech>…</tech></technologies>
 *       <repoUrl>…</repoUrl>
 *     </entry>
 *   </experience>
 * </cv>
 * ```
 */
export function parseCvXml(xml: string): ParsedCvResponse {
  const outer = getTag(xml, "cv") || xml;

  const summary = unescapeXml(getTag(outer, "summary"));

  // Skill categories
  const categoriesBlock = getTag(outer, "skillCategories");
  const categoryBlocks = getAllTags(categoriesBlock, "category");
  const skills = categoryBlocks.map((cat) => ({
    category: unescapeXml(getTag(cat, "name")),
    items: getAllTags(getTag(cat, "items"), "item").map(unescapeXml),
  }));

  // Experience entries
  const experienceBlock = getTag(outer, "experience");
  const entryBlocks = getAllTags(experienceBlock, "entry");
  const experience = entryBlocks.map((entry) => ({
    title: unescapeXml(getTag(entry, "title")),
    organization: unescapeXml(getTag(entry, "organization")),
    startDate: unescapeXml(getTag(entry, "startDate")),
    endDate: unescapeXml(getTag(entry, "endDate")),
    bullets: getAllTags(getTag(entry, "bullets"), "bullet").map(unescapeXml),
    technologies: getAllTags(getTag(entry, "technologies"), "tech").map(unescapeXml),
    repoUrl: unescapeXml(getTag(entry, "repoUrl")),
  }));

  // Certifications (may be empty)
  const certsBlock = getTag(outer, "certifications");
  const certifications = certsBlock
    ? getAllTags(certsBlock, "cert").map(unescapeXml)
    : [];

  return { summary, skills, experience, certifications };
}
