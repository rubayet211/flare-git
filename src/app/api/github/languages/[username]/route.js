import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GitHubService } from "@/lib/github";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { username } = params;
    const accessToken = session.accessToken;

    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "GitHub token not found" }),
        { status: 401 }
      );
    }

    const githubService = new GitHubService(accessToken);
    const languages = await githubService.getLanguages(username);

    return NextResponse.json(languages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
