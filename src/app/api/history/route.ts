import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({ sessions: sessions || [] });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
