import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getGitHubAccessToken } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { username } = params;
    const accessToken = await getGitHubAccessToken(session.user.id);

    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "GitHub access token not found. Please log in again." }),
        { status: 401 }
      );
    }

    const githubService = new GitHubService(accessToken);
    const trends = await githubService.getContributionTrends(username);

    return NextResponse.json(trends);
  } catch (error) {
    console.error("Error fetching contribution trends in API route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch contribution trends from GitHub" }),
      { status: 500 }
    );
  }
}
