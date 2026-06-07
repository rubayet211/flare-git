import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, getGitHubAccessToken } from "@/lib/auth";
import { GitHubProfileAnalyzer } from "@/lib/github-profile-analyzer";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Validate environment variables
    if (!process.env.AI_API_ENDPOINT || !process.env.AI_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "AI service configuration is missing" }),
        { status: 500 }
      );
    }

    // Fetch user profile from database
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    const accessToken = await getGitHubAccessToken(session.user.id);
    let githubData = null;

    if (accessToken && profile.githubUsername) {
      try {
        const analyzer = new GitHubProfileAnalyzer(accessToken);
        githubData = await analyzer.collectProfileData(profile.githubUsername);
      } catch (err) {
        console.error("Error analyzing profile data for bio context:", err);
      }
    }

    // Construct the context-rich bio prompt
    const systemPrompt = `You are a professional resume writer and career coach specializing in the tech industry.
Your task is to write a compelling, premium, and concise professional biography (3-4 sentences, approximately 80-100 words) for a developer's profile portfolio.
The bio should:
- Be written in a professional, engaging first-person or third-person narrative (default first-person "I'm a...").
- Highlight core skills, tech stack, and developer specializations based on actual GitHub data.
- Mention key achievements like total stars, contributions, or repository counts if notable.
- Focus strictly on real details. DO NOT invent or hallucinate achievements, job titles, or experience not supported by the developer statistics.
- Avoid generic filler phrases. Keep it impactful, polished, and suitable for recruiters.
- Return ONLY the clean, plain bio text. Do not include markdown headers, quotes, or formatting.`;

    const userPrompt = `Please write a professional developer bio based on the following developer telemetry:
User Name: ${profile.user?.name || "Anonymous"}
GitHub Username: ${profile.githubUsername || "Not provided"}
Current Specialization/Title: ${profile.specialization || "Developer"}
Original Bio: ${profile.bio || "No existing bio"}
Location: ${profile.location || "Not specified"}

GitHub Statistics (from telemetry):
- Total Repositories: ${githubData?.repositories?.total || 0}
- Total Stars: ${githubData?.repositories?.totalStars || 0}
- Total Contributions: ${githubData?.contributions?.total || 0}
- Key Specializations: ${githubData?.specializations?.join(", ") || "Software Engineering"}
- Extracted Skills: ${githubData?.skills?.slice(0, 10).join(", ") || "JavaScript, HTML, CSS"}

Write a professional, recruiters-facing biography (approx. 80-100 words).`;

    const response = await fetch(process.env.AI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const data = await response.json();
    const bioText = data.choices?.[0]?.message?.content?.trim();

    if (!bioText) {
      throw new Error("No bio text returned from AI");
    }

    return NextResponse.json({ bio: bioText });
  } catch (error) {
    console.error("Error generating bio in API route:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate professional bio." }),
      { status: 500 }
    );
  }
}
