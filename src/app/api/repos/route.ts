import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";

function checkRateLimit(res: Response) {
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const resetTime = res.headers.get("x-ratelimit-reset");
    const resetDate = resetTime
      ? new Date(parseInt(resetTime) * 1000).toISOString()
      : "unknown";
    throw new Error(
      `GitHub API rate limit exceeded. Resets at ${resetDate}.`
    );
  }
}

async function fetchAllRepos(accessToken: string) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    checkRateLimit(res);
    if (!res.ok) break;

    const data = await res.json();
    if (data.length === 0) break;

    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

async function fetchRepoLanguages(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/languages`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  checkRateLimit(res);
  if (!res.ok) return {};
  return res.json();
}

async function fetchRepoReadme(accessToken: string, fullName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/readme`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  checkRateLimit(res);
  if (!res.ok) return null;
  const data = await res.json();
  try {
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 2000);
  } catch {
    return null;
  }
}

const BATCH_SIZE = 10;

async function processBatched<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = session.accessToken;
  const userId = session.profileId || session.user?.email || "unknown";
  const cacheKey = CacheKeys.repos(userId);

  // Check for force-refresh via query param
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("fresh") === "1";

  // Return cached data if available and not force-refreshing
  if (!forceRefresh) {
    const cached = cache.get<{ repos: RepoDetail[] }>(cacheKey);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      res.headers.set(
        "Cache-Control",
        "private, max-age=300, stale-while-revalidate=600"
      );
      return res;
    }
  }

  try {
    const repos = await fetchAllRepos(accessToken);

    // Fetch detailed info for each repo in batches to avoid rate limits
    const detailedRepos: RepoDetail[] = await processBatched(
      repos,
      async (repo: any) => {
        const [languages, readme] = await Promise.all([
          fetchRepoLanguages(accessToken, repo.full_name),
          fetchRepoReadme(accessToken, repo.full_name),
        ]);

        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          language: repo.language,
          languages_url: repo.languages_url,
          topics: repo.topics || [],
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          pushed_at: repo.pushed_at,
          fork: repo.fork,
          private: repo.private,
          size: repo.size,
          default_branch: repo.default_branch,
          languages,
          readme,
        };
      }
    );

    const payload = { repos: detailedRepos };

    // Cache the result
    cache.set(cacheKey, payload, CacheTTL.REPOS);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    res.headers.set(
      "Cache-Control",
      "private, max-age=300, stale-while-revalidate=600"
    );
    return res;
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
