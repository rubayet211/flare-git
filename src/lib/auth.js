import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { persistGitHubAccountCredentials } from "@/lib/github-account.mjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
          bio: profile.bio,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account) {
        await persistGitHubAccountCredentials(prisma, account);
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.username = profile.login;
        token.bio = profile.bio;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.bio = token.bio;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // Check if the user's email exists in the database
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
          include: {
            accounts: true,
            profile: true,
          },
        });

        if (!existingUser) {
          // Create new user if they don't exist
          await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name || profile.login,
              image: profile.avatar_url,
              profile: {
                create: {
                  githubUsername: profile.login,
                  bio: profile.bio,
                },
              },
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  token_type: account.token_type,
                  scope: account.scope,
                },
              },
            },
          });
          return true;
        }

        // If user exists but doesn't have a GitHub account linked
        if (!existingUser.accounts.some((acc) => acc.provider === "github")) {
          // Link the GitHub account to the existing user
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
            },
          });
        }

        // Update or create profile with GitHub data
        if (!existingUser.profile) {
          await prisma.profile.create({
            data: {
              userId: existingUser.id,
              githubUsername: profile.login,
              bio: profile.bio,
            },
          });
        } else {
          // Update existing profile with latest GitHub data
          await prisma.profile.update({
            where: { userId: existingUser.id },
            data: {
              githubUsername: profile.login,
              bio: profile.bio,
            },
          });
        }

        // Update user data
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: profile.name || profile.login,
            image: profile.avatar_url,
          },
        });

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export async function getGitHubAccessToken(userId) {
  if (!userId) return null;
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: "github",
      },
    });
    return account?.access_token || null;
  } catch (error) {
    console.error("Error retrieving GitHub access token from DB:", error);
    return null;
  }
}
