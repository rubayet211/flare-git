import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getGitHubAccessToken } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { username, repo } = params;

    // Enforce repository ownership
    if (session.user.username !== username) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: You do not own this repository." }),
        { status: 403 }
      );
    }

    const accessToken = await getGitHubAccessToken(session.user.id);
    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "GitHub access token not found. Please log in again." }),
        { status: 401 }
      );
    }

    const { content } = await request.json();
    if (!content) {
      return new NextResponse(
        JSON.stringify({ error: "No content provided" }),
        { status: 400 }
      );
    }

    const githubService = new GitHubService(accessToken);
    await githubService.updateRepositoryReadme(username, repo, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating repository README in API route:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to push README update to GitHub.",
      }),
      { status: 500 }
    );
  }
}
