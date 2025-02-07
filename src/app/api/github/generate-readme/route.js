import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GitHubProfileAnalyzer } from "@/lib/github-profile-analyzer";
import { AIReadmeGenerator } from "@/lib/ai-readme-generator";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Validate environment variables
    if (!process.env.AI_API_ENDPOINT || !process.env.AI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service configuration is missing" }),
        { status: 500 }
      );
    }

    const body = await req.json();
    const { preferences } = body;

    // Get the user's profile from the database
    const profile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,
      },
    });

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    if (!profile.githubUsername) {
      return new Response(
        JSON.stringify({ error: "GitHub username not found" }),
        { status: 400 }
      );
    }

    // Check if we have a valid GitHub access token
    if (!session.accessToken) {
      return new Response(
        JSON.stringify({ error: "GitHub access token not found" }),
        { status: 401 }
      );
    }

    try {
      // Initialize the GitHub profile analyzer with the access token
      const analyzer = new GitHubProfileAnalyzer(session.accessToken);

      // Collect GitHub data
      const githubData = await analyzer.collectProfileData(
        profile.githubUsername
      );

      // Combine GitHub data with FlareGit profile data
      const combinedProfileData = {
        github: githubData,
        flaregit: {
          customUrl: profile.customUrl,
          location: profile.location,
          website: profile.website,
          twitter: profile.twitter,
          linkedin: profile.linkedin,
          theme: profile.customTheme,
        },
        user: {
          name: profile.user.name,
          email: profile.user.email,
          image: profile.user.image,
        },
      };

      // Initialize the AI README generator with environment variables
      const generator = new AIReadmeGenerator(
        process.env.AI_API_ENDPOINT,
        process.env.AI_API_KEY
      );

      // Generate the README
      const readme = await generator.generateReadme(
        combinedProfileData,
        preferences
      );

      if (!readme) {
        throw new Error("No README content was generated");
      }

      // Save the generated README to the profile
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          generatedReadme: readme,
          lastReadmeUpdate: new Date(),
        },
      });

      return new Response(JSON.stringify({ readme }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error in GitHub/AI processing:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process GitHub data or generate README",
          details: error.message,
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating README:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get the user's profile and their generated README
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        generatedReadme: true,
        lastReadmeUpdate: true,
      },
    });

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        readme: profile.generatedReadme,
        lastUpdate: profile.lastReadmeUpdate,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching README:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch README" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
