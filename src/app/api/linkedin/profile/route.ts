import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the LinkedIn profile data stored in the cookie after OAuth callback.
 * The cookie is cleared after reading so the data is consumed once.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const linkedinCookie = request.cookies.get("linkedin_profile_data")?.value;

  if (!linkedinCookie) {
    return NextResponse.json(
      { error: "No LinkedIn data available. Please connect LinkedIn first." },
      { status: 404 }
    );
  }

  try {
    const profile = JSON.parse(linkedinCookie);

    const response = NextResponse.json({
      profile: {
        fullName: profile.name || "",
        email: profile.email || "",
        picture: profile.picture || "",
        givenName: profile.givenName || "",
        familyName: profile.familyName || "",
        linkedInSub: profile.sub || "",
      },
    });

    // Clear the cookie after consuming the data
    response.cookies.delete("linkedin_profile_data");

    return response;
  } catch (err) {
    console.error("Failed to parse LinkedIn profile data:", err);
    return NextResponse.json(
      { error: "Invalid LinkedIn data" },
      { status: 500 }
    );
  }
}
