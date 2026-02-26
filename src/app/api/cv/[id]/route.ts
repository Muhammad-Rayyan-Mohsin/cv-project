import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { structuredCvToMarkdown } from "@/lib/cv-utils";
import { CvSaveRequestSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/tracking";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`cv-put:${session.profileId}`, 20, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", remaining: rl.remaining },
      { status: 429 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "CV ID required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parseResult = CvSaveRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { structuredCv } = parseResult.data;

  try {
    // Generate markdown from the updated structured CV
    const cvMarkdown = structuredCvToMarkdown(structuredCv);

    const { error } = await supabase
      .from("generated_cvs")
      .update({
        structured_cv: structuredCv,
        cv_content: cvMarkdown,
      })
      .eq("id", id)
      .eq("user_id", session.profileId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update CV" },
        { status: 500 },
      );
    }

    trackEvent(session.profileId, "cv_saved", { cvId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV update error:", error);
    return NextResponse.json(
      { error: "Failed to update CV" },
      { status: 500 },
    );
  }
}
