import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { username } = params;

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [{ githubUsername: username }, { customUrl: username }],
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

    if (!profile) {
      return new NextResponse(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    // Transform the data to include user details
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
