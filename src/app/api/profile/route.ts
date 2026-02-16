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
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "full_name, email, phone, location, linkedin_url, website_url, education, github_username, avatar_url"
      )
      .eq("id", session.profileId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    // Fetch work_experience separately to handle missing column gracefully
    let workExperience: unknown[] = [];
    try {
      const { data: weData, error: weError } = await supabase
        .from("profiles")
        .select("work_experience")
        .eq("id", session.profileId)
        .single();

      if (weError) {
        // Only ignore "column not found" errors (PostgreSQL error code 42703)
        const isColumnMissing =
          weError.message?.includes("column") ||
          weError.code === "42703" ||
          weError.message?.includes("work_experience");
        if (!isColumnMissing) {
          console.error("Failed to fetch work_experience:", weError);
        }
      } else if (weData && weData.work_experience) {
        workExperience = weData.work_experience as unknown[];
      }
    } catch (err) {
      console.error("Unexpected error fetching work_experience:", err);
    }

    return NextResponse.json({
      profile: {
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        linkedIn: data.linkedin_url || "",
        website: data.website_url || "",
        github: data.github_username || "",
        education: data.education || [],
        workExperience,
        avatarUrl: data.avatar_url || "",
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.profileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, email, phone, location, linkedIn, website, education, workExperience } =
      body;

    const updateData: Record<string, unknown> = {
      full_name: fullName || null,
      email: email || null,
      phone: phone || null,
      location: location || null,
      linkedin_url: linkedIn || null,
      website_url: website || null,
      education: education || [],
      updated_at: new Date().toISOString(),
    };

    // Only include work_experience if the column exists
    if (workExperience !== undefined) {
      updateData.work_experience = workExperience || [];
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", session.profileId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
