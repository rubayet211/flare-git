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
      return NextResponse.json(
        {
          error: "GitHub authorization is missing. Sign in with GitHub again.",
          code: "GITHUB_AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const githubService = new GitHubService(accessToken);
    const repositories = await githubService.getRepositories(username);

    return NextResponse.json(repositories);
  } catch (error) {
    if (error.message === "GitHub authentication failed") {
      return NextResponse.json(
        {
          error: "GitHub authorization expired. Sign in with GitHub again.",
          code: "GITHUB_AUTH_EXPIRED",
        },
        { status: 401 }
      );
    }

    console.error("Error fetching repositories:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
