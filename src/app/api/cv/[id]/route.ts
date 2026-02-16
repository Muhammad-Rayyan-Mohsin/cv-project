import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { structuredCvToMarkdown } from "@/lib/cv-utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "CV ID required" }, { status: 400 });
  }

  try {
    const { structuredCv } = await request.json();
    if (!structuredCv) {
      return NextResponse.json(
        { error: "structuredCv is required" },
        { status: 400 }
      );
    }

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
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CV update error:", error);
    return NextResponse.json(
      { error: "Failed to update CV" },
      { status: 500 }
    );
  }
}
