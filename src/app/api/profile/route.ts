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
    const { fullName, email, phone, location, linkedIn, website, education } =
      body;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        location: location || null,
        linkedin_url: linkedIn || null,
        website_url: website || null,
        education: education || [],
        updated_at: new Date().toISOString(),
      })
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
