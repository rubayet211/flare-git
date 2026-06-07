import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Octokit } from "octokit";
import { authOptions, getGitHubAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishProfileReadme } from "@/lib/github-readme-publisher.mjs";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "README content is required" },
        { status: 400 }
      );
    }

    const accessToken = await getGitHubAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub access token not found. Please log in again." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { githubUsername: true },
    });
    const githubUsername = session.user.username || profile?.githubUsername;
    if (!githubUsername) {
      return NextResponse.json(
        { error: "GitHub username not found for this account." },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: accessToken });
    const result = await publishProfileReadme({
      octokit,
      username: githubUsername,
      content,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error publishing profile README to GitHub:", error);
    return NextResponse.json(
      { error: "Failed to publish Profile README to GitHub." },
      { status: 500 }
    );
  }
}
