import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const storedState = request.cookies.get("linkedin_oauth_state")?.value;

  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      new URL(
        `/dashboard/profile?linkedin=error&message=${encodeURIComponent(msg)}`,
        request.url
      )
    );
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/profile?linkedin=error&message=Invalid+OAuth+state.+Please+try+again.",
        request.url
      )
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://cv-project-jet.vercel.app";
  const redirectUri = `${baseUrl}/api/linkedin/callback`;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("LinkedIn token exchange failed:", errBody);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile from LinkedIn UserInfo endpoint (OpenID Connect)
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!profileResponse.ok) {
      const errBody = await profileResponse.text();
      console.error("LinkedIn profile fetch failed:", errBody);
      throw new Error("Failed to fetch LinkedIn profile");
    }

    const profile = await profileResponse.json();

    // Build the LinkedIn profile URL from the sub (member ID)
    // The vanity name is not available via userinfo, so we use the sub as fallback
    const linkedinData = JSON.stringify({
      name: profile.name || "",
      email: profile.email || "",
      picture: profile.picture || "",
      givenName: profile.given_name || "",
      familyName: profile.family_name || "",
      sub: profile.sub || "",
      locale: profile.locale
        ? `${profile.locale.language}_${profile.locale.country}`
        : "",
    });

    const response = NextResponse.redirect(
      new URL("/dashboard/profile?linkedin=connected", request.url)
    );

    // Clear the state cookie
    response.cookies.delete("linkedin_oauth_state");

    // Store LinkedIn profile data in a short-lived secure cookie
    response.cookies.set("linkedin_profile_data", linkedinData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes — enough time to import
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("LinkedIn callback error:", err);
    const response = NextResponse.redirect(
      new URL(
        "/dashboard/profile?linkedin=error&message=Failed+to+connect+LinkedIn.+Please+try+again.",
        request.url
      )
    );
    response.cookies.delete("linkedin_oauth_state");
    return response;
  }
}
