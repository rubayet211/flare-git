import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GitHubService } from "@/lib/github";
import { buildPortfolioData } from "@/lib/portfolio-data.mjs";

const TELEMETRY_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request, { params }) {
  try {
    const { username } = params;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ githubUsername: username }, { customUrl: username }],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            accounts: {
              where: { provider: "github" },
              select: {
                access_token: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    const githubAccessToken = profile.user.accounts[0]?.access_token;

    // Use cached telemetry if fresh (< 15 min old)
    let githubData;
    const isCacheFresh =
      profile.lastTelemetryUpdate &&
      Date.now() - new Date(profile.lastTelemetryUpdate).getTime() < TELEMETRY_TTL_MS;

    if (isCacheFresh && profile.githubTelemetry) {
      githubData = profile.githubTelemetry;
    } else {
      githubData = await getPublicGitHubData(
        profile.githubUsername,
        githubAccessToken
      );

      // Persist cache before responding so serverless runtimes cannot drop it.
      if (githubData && Object.keys(githubData).length > 0) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            githubTelemetry: githubData,
            lastTelemetryUpdate: new Date(),
          },
        });
      }
    }

    // Transform the data to include user details and public portfolio data.
    const profileData = {
      ...profile,
      name: profile.user.name,
      email: profile.user.email,
      image: profile.user.image,
      portfolio: buildPortfolioData(profile, githubData),
    };
    delete profileData.user;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

async function getPublicGitHubData(username, accessToken) {
  if (!username || !accessToken) {
    return {};
  }

  try {
    const githubService = new GitHubService(accessToken);
    const [repositories, languages, stats, contributions, trends] =
      await Promise.all([
        githubService.getRepositories(username),
        githubService.getLanguages(username),
        githubService.getRepositoryStats(username),
        githubService.getContributions(username),
        githubService.getContributionTrends(username),
      ]);

    return { repositories, languages, stats, contributions, trends };
  } catch (error) {
    console.error("Error enriching public portfolio:", error);
    return {};
  }
}
