import { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { supabase } from "./supabase";

export const authOptions: AuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;

        const ghProfile = profile as {
          id: number;
          login: string;
          avatar_url?: string;
          bio?: string;
          email?: string;
        };

        // Upsert user profile to Supabase on sign-in (retry once on failure)
        let profileSynced = false;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { data } = await supabase
              .from("profiles")
              .upsert(
                {
                  github_id: ghProfile.id,
                  github_username: ghProfile.login,
                  avatar_url: ghProfile.avatar_url || null,
                  bio: ghProfile.bio || null,
                  email: ghProfile.email || token.email || null,
                },
                { onConflict: "github_id" },
              )
              .select("id")
              .single();

            if (data) {
              token.profileId = data.id;
              profileSynced = true;
              break;
            }
          } catch (err) {
            console.error(
              `Failed to sync profile to Supabase (attempt ${attempt + 1}/2):`,
              err,
            );
            if (attempt === 0) {
              // Brief pause before retry
              await new Promise((r) => setTimeout(r, 500));
            }
          }
        }

        if (!profileSynced) {
          console.error(
            "Profile sync failed after 2 attempts. Sign-in will proceed without profileId.",
          );
          token.profileSyncFailed = true;
        }

        token.githubId = ghProfile.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.profileId = token.profileId as string;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
