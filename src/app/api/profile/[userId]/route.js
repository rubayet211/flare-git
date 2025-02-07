import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        customUrl: data.customUrl,
        location: data.location,
        website: data.website,
        twitter: data.twitter,
        linkedin: data.linkedin,
        customTheme: data.customTheme,
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
