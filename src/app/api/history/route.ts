import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/tracking";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`history-get:${session.profileId}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", remaining: rl.remaining },
      { status: 429 },
    );
  }

  const cacheKey = CacheKeys.history(session.profileId);

  // Return cached data if available
  const cached = cache.get<{ sessions: unknown[] }>(cacheKey);
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
    // Fetch analysis sessions with their CVs, most recent first
    const { data: sessions, error } = await supabase
      .from("analysis_sessions")
      .select(
        `
        id,
        summary,
        status,
        selected_repos,
        created_at,
        generated_cvs (
          id,
          role_title,
          role_description,
          skills,
          matching_repos,
          cv_content,
          structured_cv,
          created_at
        )
      `
      )
      .eq("user_id", session.profileId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      );
    }

    const payload = { sessions: sessions || [] };

    // Cache the result
    cache.set(cacheKey, payload, CacheTTL.HISTORY);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    res.headers.set(
      "Cache-Control",
      "private, max-age=60, stale-while-revalidate=120"
    );
    return res;
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`history-delete:${session.profileId}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", remaining: rl.remaining },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID required" },
      { status: 400 }
    );
  }

  try {
    // Verify the session belongs to this user before deleting
    const { error } = await supabase
      .from("analysis_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", session.profileId);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    // Invalidate history and usage caches for this user
    cache.delete(CacheKeys.history(session.profileId));
    cache.delete(CacheKeys.usage(session.profileId));

    trackEvent(session.profileId, "session_deleted", { sessionId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
