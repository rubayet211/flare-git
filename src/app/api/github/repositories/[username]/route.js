import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // Get the GitHub access token from the user's session
    const accessToken = session.accessToken;

    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "GitHub token not found" }),
        { status: 401 }
      );
    }

    const githubService = new GitHubService(accessToken);
    const repositories = await githubService.getRepositories(username);

    return NextResponse.json(repositories);
  } catch (error) {
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
