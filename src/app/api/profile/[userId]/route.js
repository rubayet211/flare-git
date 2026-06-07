import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getContrastRatio } from "@/lib/utils";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { userId } = params;
    if (session.user.id !== userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    // Combine user and profile data
    const profileData = {
      ...profile,
      name: profile.user.name,
      email: profile.user.email,
      image: profile.user.image,
    };
    delete profileData.user;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { userId } = params;
    if (session.user.id !== userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
      });
    }

    const data = await request.json();

    let customUrl = data.customUrl ? data.customUrl.trim().toLowerCase() : null;
    if (customUrl === "") customUrl = null;

    if (customUrl) {
      // 1. Format validation
      const slugRegex = /^[a-zA-Z0-9-_]+$/;
      if (!slugRegex.test(customUrl)) {
        return new NextResponse(
          JSON.stringify({ error: "URL slug can only contain letters, numbers, hyphens, and underscores." }),
          { status: 400 }
        );
      }

      // 2. Length check
      if (customUrl.length > 30) {
        return new NextResponse(
          JSON.stringify({ error: "URL slug cannot be longer than 30 characters." }),
          { status: 400 }
        );
      }

      // 3. Reserved words check
      const reservedSlugs = [
        "dashboard", "auth", "api", "admin", "settings", "profile",
        "user", "privacy", "terms", "signin", "signup", "u"
      ];
      if (reservedSlugs.includes(customUrl)) {
        return new NextResponse(
          JSON.stringify({ error: "This URL slug is reserved and cannot be used." }),
          { status: 400 }
        );
      }

      // 4. Collision check against other users' custom URLs and GitHub usernames
      const profilesToCheck = await prisma.profile.findMany({
        where: {
          NOT: { userId },
        },
        select: {
          githubUsername: true,
          customUrl: true,
        },
      });
      const normalizedCustomUrl = customUrl.toLowerCase();
      const hasCollision = profilesToCheck.some((profile) =>
        [profile.githubUsername, profile.customUrl].some(
          (value) => value?.toLowerCase() === normalizedCustomUrl
        )
      );

      if (hasCollision) {
        return new NextResponse(
          JSON.stringify({ error: "This profile URL is already taken." }),
          { status: 400 }
        );
      }
    }

    // Server-side WCAG contrast validation
    if (data.customTheme) {
      const { text, heading, background } = data.customTheme;
      if (text && background) {
        const textContrast = getContrastRatio(text, background);
        if (textContrast < 2.5) {
          return new NextResponse(
            JSON.stringify({
              error: `Text color contrast ratio is too low (${textContrast.toFixed(2)}:1). Minimum 2.5:1 required.`,
            }),
            { status: 400 }
          );
        }
      }
      if (heading && background) {
        const headingContrast = getContrastRatio(heading, background);
        if (headingContrast < 2.5) {
          return new NextResponse(
            JSON.stringify({
              error: `Heading color contrast ratio is too low (${headingContrast.toFixed(2)}:1). Minimum 2.5:1 required.`,
            }),
            { status: 400 }
          );
        }
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        customUrl: customUrl,
        location: data.location,
        website: data.website,
        twitter: data.twitter,
        linkedin: data.linkedin,
        customTheme: data.customTheme,
        featuredProjects: data.featuredProjects,
        specialization: data.specialization,
        aiGeneratedBio: data.aiGeneratedBio,
        generatedReadme: data.generatedReadme,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Combine user and profile data for response
    const responseData = {
      ...updatedProfile,
      name: updatedProfile.user.name,
      email: updatedProfile.user.email,
      image: updatedProfile.user.image,
    };
    delete responseData.user;

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
