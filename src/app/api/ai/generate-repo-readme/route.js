import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AIReadmeGenerator } from "@/lib/ai-readme-generator";

export async function POST(request) {
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

    const { repository, existingReadme, files } = await request.json();

    // Initialize the AI README generator
    const generator = new AIReadmeGenerator(
      process.env.AI_API_ENDPOINT,
      process.env.AI_API_KEY
    );

    // Generate the README
    const readme = await generator.generateRepositoryReadme(
      repository,
      existingReadme,
      files
    );

    if (!readme) {
      throw new Error("No README content was generated");
    }

    return new NextResponse(JSON.stringify({ readme }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating repository README:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
