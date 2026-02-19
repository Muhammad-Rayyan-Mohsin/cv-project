/**
 * Behance API route — fetches a user's public portfolio.
 *
 * Strategy:
 *  1. If `BEHANCE_API_KEY` env var is set → use the legacy Behance v2 API.
 *  2. Otherwise → scrape the public Behance profile page and extract the
 *     embedded `__NEXT_DATA__` JSON payload (Behance uses Next.js).
 *
 * Query params:
 *  - `username` (required): Behance username
 *  - `fresh`   (optional): set to "1" to bypass the server cache
 *
 * Returns: { portfolio: BehancePortfolio }
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import type {
  BehanceProject,
  BehanceProjectCard,
  BehancePortfolio,
  BehanceUser,
} from "@/lib/behance-types";

// ---------------------------------------------------------------------------
// Strategy 1 — Legacy Behance API (api.behance.net/v2)
// ---------------------------------------------------------------------------

async function fetchFromApi(
  username: string,
  apiKey: string
): Promise<BehancePortfolio> {
  // Fetch user profile
  const userRes = await fetch(
    `https://api.behance.net/v2/users/${encodeURIComponent(username)}?api_key=${apiKey}`
  );

  let user: BehanceUser | null = null;
  if (userRes.ok) {
    const userData = await userRes.json();
    user = userData.user ?? null;
  }

  // Fetch projects (paginated, max 3 pages × 24 per page = 72 projects)
  const projects: BehanceProject[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `https://api.behance.net/v2/users/${encodeURIComponent(username)}/projects?api_key=${apiKey}&per_page=24&page=${page}`
    );
    if (!res.ok) break;

    const data = await res.json();
    const batch: BehanceProject[] = data.projects ?? [];
    projects.push(...batch);
    if (batch.length < 24) break; // last page
  }

  return { user, projects, source: "api" };
}

// ---------------------------------------------------------------------------
// Strategy 2 — Public profile scraping (embedded Next.js data)
// ---------------------------------------------------------------------------

async function fetchFromPublicProfile(
  username: string
): Promise<BehancePortfolio> {
  const profileUrl = `https://www.behance.net/${encodeURIComponent(username)}`;

  const res = await fetch(profileUrl, {
    headers: {
      // Behance may serve different content based on user-agent
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Behance user "${username}" not found`);
    }
    throw new Error(`Failed to fetch Behance profile (HTTP ${res.status})`);
  }

  const html = await res.text();

  // Extract __NEXT_DATA__ JSON embedded in the page
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!nextDataMatch) {
    // Fallback: try to extract Open Graph and meta data
    return extractMetaFallback(html, username);
  }

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    return parseNextData(nextData, username);
  } catch {
    return extractMetaFallback(html, username);
  }
}

/**
 * Parse the __NEXT_DATA__ JSON blob from a Behance profile page.
 * The structure can change, so we defensively extract what we can.
 */
function parseNextData(
  nextData: Record<string, unknown>,
  username: string
): BehancePortfolio {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = nextData?.props as any;
  const pageProps = props?.pageProps;

  // Try to find profile data in various possible locations
  const profileData =
    pageProps?.profile ?? pageProps?.user ?? pageProps?.owner ?? null;

  // Try to find projects
  const rawProjects: unknown[] =
    pageProps?.projects ??
    pageProps?.profileProjects ??
    profileData?.projects ??
    [];

  const user: BehanceUser | null = profileData
    ? {
        id: profileData.id ?? 0,
        username: profileData.username ?? username,
        first_name: profileData.first_name ?? profileData.firstName ?? "",
        last_name: profileData.last_name ?? profileData.lastName ?? "",
        display_name:
          profileData.display_name ??
          profileData.displayName ??
          `${profileData.first_name ?? ""} ${profileData.last_name ?? ""}`.trim(),
        city: profileData.city ?? "",
        state: profileData.state ?? "",
        country: profileData.country ?? "",
        company: profileData.company ?? "",
        occupation: profileData.occupation ?? "",
        url: `https://www.behance.net/${username}`,
        images: profileData.images ?? {},
        fields: profileData.fields ?? [],
        stats: {
          followers: profileData.stats?.followers ?? 0,
          following: profileData.stats?.following ?? 0,
          appreciations: profileData.stats?.appreciations ?? 0,
          views: profileData.stats?.views ?? 0,
          comments: profileData.stats?.comments ?? 0,
        },
        bio: profileData.bio ?? profileData.about ?? "",
        created_on: profileData.created_on ?? 0,
        website: profileData.website ?? "",
      }
    : null;

  const projects: BehanceProject[] = (rawProjects as Record<string, unknown>[]).map(
    (p: Record<string, unknown>) => normalizeProject(p)
  );

  return { user, projects, source: "scrape" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProject(p: any): BehanceProject {
  const covers = p.covers ?? p.cover ?? {};
  return {
    id: p.id ?? 0,
    name: p.name ?? p.title ?? "Untitled",
    slug: p.slug ?? "",
    description: p.description ?? p.short_description ?? null,
    url: p.url ?? `https://www.behance.net/gallery/${p.id}/${p.slug ?? ""}`,
    covers: {
      url: covers.original ?? covers.url ?? covers["808"] ?? covers["404"] ?? "",
      url_115: covers["115"] ?? undefined,
      url_202: covers["202"] ?? undefined,
      url_404: covers["404"] ?? undefined,
      url_808: covers["808"] ?? undefined,
    },
    fields: Array.isArray(p.fields)
      ? p.fields.map((f: string | { name: string }) =>
          typeof f === "string" ? f : f.name
        )
      : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    tools: Array.isArray(p.tools)
      ? p.tools.map((t: string | { title: string; id?: number; category?: string }) =>
          typeof t === "string"
            ? { id: 0, title: t, category: "", category_label: "", category_id: 0 }
            : {
                id: t.id ?? 0,
                title: t.title ?? "",
                category: (t as Record<string, unknown>).category as string ?? "",
                category_label:
                  ((t as Record<string, unknown>).category_label as string) ?? "",
                category_id: ((t as Record<string, unknown>).category_id as number) ?? 0,
              }
        )
      : [],
    stats: {
      views: p.stats?.views ?? 0,
      appreciations: p.stats?.appreciations ?? 0,
      comments: p.stats?.comments ?? 0,
    },
    published_on: p.published_on ?? 0,
    modified_on: p.modified_on ?? 0,
    created_on: p.created_on ?? 0,
    mature_content: p.mature_content ?? false,
  };
}

/**
 * Last-resort fallback: parse Open Graph meta tags from the HTML.
 */
function extractMetaFallback(
  html: string,
  username: string
): BehancePortfolio {
  const titleMatch = html.match(
    /<meta property="og:title" content="([^"]*)"[^>]*>/
  );
  const descMatch = html.match(
    /<meta property="og:description" content="([^"]*)"[^>]*>/
  );
  const imageMatch = html.match(
    /<meta property="og:image" content="([^"]*)"[^>]*>/
  );

  const displayName = titleMatch?.[1] ?? username;

  return {
    user: {
      id: 0,
      username,
      first_name: displayName.split(" ")[0] ?? "",
      last_name: displayName.split(" ").slice(1).join(" ") ?? "",
      display_name: displayName,
      city: "",
      state: "",
      country: "",
      company: "",
      occupation: descMatch?.[1] ?? "",
      url: `https://www.behance.net/${username}`,
      images: imageMatch ? { original: imageMatch[1] } : {},
      fields: [],
      stats: { followers: 0, following: 0, appreciations: 0, views: 0, comments: 0 },
      bio: descMatch?.[1] ?? "",
      created_on: 0,
      website: "",
    },
    projects: [],
    source: "scrape",
  };
}

// ---------------------------------------------------------------------------
// Normalize projects → simplified card format
// ---------------------------------------------------------------------------

function toProjectCards(projects: BehanceProject[]): BehanceProjectCard[] {
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    url: p.url,
    coverUrl:
      p.covers.url_404 ?? p.covers.url_808 ?? p.covers.url ?? null,
    fields: p.fields,
    tags: p.tags,
    tools: p.tools.map((t) => t.title).filter(Boolean),
    views: p.stats.views,
    appreciations: p.stats.appreciations,
    publishedAt: p.published_on
      ? new Date(p.published_on * 1000).toISOString()
      : new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const forceRefresh = searchParams.get("fresh") === "1";

  if (!username || username.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: username" },
      { status: 400 }
    );
  }

  const sanitizedUsername = username.trim().toLowerCase();
  const userId = session.profileId || session.user?.email || "unknown";
  const cacheKey = CacheKeys.behance(userId, sanitizedUsername);

  // Return cached data if available
  if (!forceRefresh) {
    const cached = cache.get<{
      portfolio: { user: BehanceUser | null; source: string };
      projects: BehanceProjectCard[];
    }>(cacheKey);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }
  }

  try {
    const apiKey = process.env.BEHANCE_API_KEY;
    let portfolio: BehancePortfolio;

    if (apiKey) {
      // Strategy 1: use the legacy Behance API
      try {
        portfolio = await fetchFromApi(sanitizedUsername, apiKey);
      } catch {
        // Fallback to scraping if the API fails
        console.warn(
          "[Behance] API key provided but request failed, falling back to scraping"
        );
        portfolio = await fetchFromPublicProfile(sanitizedUsername);
      }
    } else {
      // Strategy 2: scrape the public profile page
      portfolio = await fetchFromPublicProfile(sanitizedUsername);
    }

    const projectCards = toProjectCards(portfolio.projects);

    const payload = {
      portfolio: {
        user: portfolio.user,
        source: portfolio.source,
      },
      projects: projectCards,
    };

    cache.set(cacheKey, payload, CacheTTL.BEHANCE);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error) {
    console.error("[Behance] Error fetching portfolio:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch Behance portfolio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
