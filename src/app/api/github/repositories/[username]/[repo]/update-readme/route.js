import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const accessToken = session.accessToken;

    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "GitHub token not found" }),
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
    console.error("Error updating repository README:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
