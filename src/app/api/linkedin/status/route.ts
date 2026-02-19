import { NextResponse } from "next/server";

/**
 * GET /api/linkedin/status
 * Returns whether LinkedIn OAuth integration is configured on this deployment.
 * No auth required — this is a public configuration check.
 */
export async function GET() {
  const configured = !!(
    process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
  );

  return NextResponse.json({ configured });
}
