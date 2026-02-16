import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = CacheKeys.usage(session.profileId);

  // Return cached data if available
  const cached = cache.get<Record<string, unknown>>(cacheKey);
  if (cached) {
    const res = NextResponse.json(cached);
    res.headers.set("X-Cache", "HIT");
    res.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120"
    );
    return res;
  }

  try {
    // Fetch all token usage records for the user, most recent first
    const { data: records, error } = await supabase
      .from("token_usage")
      .select("*")
      .eq("user_id", session.profileId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch usage" },
        { status: 500 }
      );
    }

    const usage = records || [];

    // Compute aggregates
    const totals = usage.reduce(
      (acc, record) => ({
        totalPromptTokens: acc.totalPromptTokens + record.prompt_tokens,
        totalCompletionTokens:
          acc.totalCompletionTokens + record.completion_tokens,
        totalTokens: acc.totalTokens + record.total_tokens,
        totalCostUsd: acc.totalCostUsd + Number(record.estimated_cost_usd),
        totalRequests: acc.totalRequests + 1,
      }),
      {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        totalCostUsd: 0,
        totalRequests: 0,
      }
    );

    const payload = {
      ...totals,
      records: usage.map((r) => ({
        id: r.id,
        model: r.model,
        promptTokens: r.prompt_tokens,
        completionTokens: r.completion_tokens,
        totalTokens: r.total_tokens,
        costUsd: Number(r.estimated_cost_usd),
        createdAt: r.created_at,
      })),
    };

    // Cache the result
    cache.set(cacheKey, payload, CacheTTL.USAGE);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    res.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120"
    );
    return res;
  } catch (error) {
    console.error("Usage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
