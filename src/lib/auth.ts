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
          scope: "read:user user:email read:org",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;

        // Upsert user profile to Supabase on sign-in
        const ghProfile = profile as {
          id: number;
          login: string;
          avatar_url?: string;
          bio?: string;
          email?: string;
        };

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
              { onConflict: "github_id" }
            )
            .select("id")
            .single();

          if (data) {
            token.profileId = data.id;
          }
        } catch (err) {
          console.error("Failed to sync profile to Supabase:", err);
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
