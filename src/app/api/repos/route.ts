import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RepoDetail } from "@/lib/types";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

const MAX_REPOS = 200;

// ---------------------------------------------------------------------------
// GitHub GraphQL — fetch repos + languages in a single query
// ---------------------------------------------------------------------------

const REPOS_GRAPHQL_QUERY = `
query($cursor: String) {
  viewer {
    repositories(
      first: 100
      after: $cursor
      ownerAffiliations: OWNER
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        databaseId
        name
        nameWithOwner
        description
        url
        primaryLanguage { name }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node { name }
          }
        }
        repositoryTopics(first: 10) {
          nodes { topic { name } }
        }
        stargazerCount
        forkCount
        createdAt
        updatedAt
        pushedAt
        isFork
        isPrivate
        diskUsage
        defaultBranchRef { name }
      }
    }
  }
}
`;

interface GraphQLRepoNode {
  databaseId: number;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  primaryLanguage: { name: string } | null;
  languages: {
    edges: { size: number; node: { name: string } }[];
  };
  repositoryTopics: {
    nodes: { topic: { name: string } }[];
  };
  stargazerCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isFork: boolean;
  isPrivate: boolean;
  diskUsage: number;
  defaultBranchRef: { name: string } | null;
}

function mapGraphQLRepoToRepoDetail(node: GraphQLRepoNode): RepoDetail {
  const languages: Record<string, number> = {};
  for (const edge of node.languages.edges) {
    languages[edge.node.name] = edge.size;
  }

  return {
    id: node.databaseId,
    name: node.name,
    full_name: node.nameWithOwner,
    description: node.description,
    html_url: node.url,
    language: node.primaryLanguage?.name ?? null,
    languages_url: `https://api.github.com/repos/${node.nameWithOwner}/languages`,
    topics: node.repositoryTopics.nodes.map((t) => t.topic.name),
    stargazers_count: node.stargazerCount,
    forks_count: node.forkCount,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
    pushed_at: node.pushedAt,
    fork: node.isFork,
    private: node.isPrivate,
    size: node.diskUsage,
    default_branch: node.defaultBranchRef?.name ?? "main",
    languages,
  };
}

async function fetchAllReposGraphQL(accessToken: string): Promise<RepoDetail[]> {
  const repos: RepoDetail[] = [];
  let cursor: string | null = null;

  while (repos.length < MAX_REPOS) {
    const response: Response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: REPOS_GRAPHQL_QUERY,
        variables: { cursor },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub GraphQL error (${response.status}): ${text.slice(0, 200)}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await response.json();

    if (json.errors?.length) {
      throw new Error(
        `GitHub GraphQL errors: ${JSON.stringify(json.errors[0])}`,
      );
    }

    const connection: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: GraphQLRepoNode[] } = json.data.viewer.repositories;
    const nodes: GraphQLRepoNode[] = connection.nodes;

    for (const node of nodes) {
      if (repos.length >= MAX_REPOS) break;
      repos.push(mapGraphQLRepoToRepoDetail(node));
    }

    if (!connection.pageInfo.hasNextPage) break;
    cursor = connection.pageInfo.endCursor;
  }

  return repos;
}

// ---------------------------------------------------------------------------
// Stale-while-revalidate: prevent duplicate background refreshes
// ---------------------------------------------------------------------------

const refreshInProgress = new Set<string>();

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.profileId || session.user?.email || "unknown";
  const rl = rateLimit(`repos:${userId}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", remaining: rl.remaining },
      { status: 429 },
    );
  }

  const accessToken = session.accessToken;
  const cacheKey = CacheKeys.repos(userId);

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("fresh") === "1";

  // Return cached data if available and not force-refreshing
  if (!forceRefresh) {
    const cached = cache.getWithStaleness<{ repos: RepoDetail[] }>(
      cacheKey,
      CacheTTL.REPOS_STALE_GRACE,
    );

    if (cached) {
      const res = NextResponse.json(cached.data);
      res.headers.set("X-Cache", cached.isStale ? "STALE" : "HIT");
      res.headers.set(
        "Cache-Control",
        "private, max-age=300, stale-while-revalidate=600",
      );

      // If stale, trigger background refresh (fire and forget)
      if (cached.isStale && !refreshInProgress.has(cacheKey)) {
        refreshInProgress.add(cacheKey);
        fetchAllReposGraphQL(accessToken)
          .then((repos) => {
            cache.set(cacheKey, { repos }, CacheTTL.REPOS);
          })
          .catch((err) => {
            console.error("Background repo refresh failed:", err);
          })
          .finally(() => {
            refreshInProgress.delete(cacheKey);
          });
      }

      return res;
    }
  }

  // Cache miss or force refresh — fetch synchronously
  try {
    const repos = await fetchAllReposGraphQL(accessToken);
    const payload = { repos };

    cache.set(cacheKey, payload, CacheTTL.REPOS);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    res.headers.set(
      "Cache-Control",
      "private, max-age=300, stale-while-revalidate=600",
    );
    return res;
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 },
    );
  }
}
