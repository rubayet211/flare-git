"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";

const defaultTheme = {
  primary: "#3b82f6",
  background: "#ffffff",
  card: "#f8fafc",
  text: "#1e293b",
  heading: "#0f172a",
};

export default function ProfilePage({ params }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${params.username}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.username]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-gray-200" />
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  const theme = profile?.customTheme || defaultTheme;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <div className="container mx-auto py-10">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="h-24 w-24 overflow-hidden rounded-full border-4"
              style={{ borderColor: theme.primary }}
            >
              {profile?.image ? (
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Github
                    className="h-10 w-10"
                    style={{ color: theme.primary }}
                  />
                </div>
              )}
            </div>
            <div>
              <h1
                className="text-3xl font-bold"
                style={{ color: theme.heading }}
              >
                {profile?.name}
              </h1>
              <p className="text-lg opacity-80">@{profile?.githubUsername}</p>
              {profile?.company && (
                <p className="mt-1 flex items-center text-sm opacity-80">
                  <Github className="mr-1 h-4 w-4" />
                  {profile.company}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="mb-8">
            <p className="text-lg" style={{ color: theme.text }}>
              {profile.bio}
            </p>
          </div>
        )}

        {/* Social Links */}
        <div className="mb-8 flex space-x-4">
          {profile?.twitter && (
            <a
              href={`https://twitter.com/${profile.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80"
              style={{ color: theme.primary }}
            >
              <Twitter className="h-6 w-6" />
            </a>
          )}
          {profile?.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80"
              style={{ color: theme.primary }}
            >
              <Linkedin className="h-6 w-6" />
            </a>
          )}
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80"
              style={{ color: theme.primary }}
            >
              <Globe className="h-6 w-6" />
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card
            className="p-6 text-center"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: theme.primary }}
            >
              12
            </div>
            <div className="mt-1 text-sm opacity-80">Repositories</div>
          </Card>
          <Card
            className="p-6 text-center"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: theme.primary }}
            >
              1.2k
            </div>
            <div className="mt-1 text-sm opacity-80">Contributions</div>
          </Card>
          <Card
            className="p-6 text-center"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: theme.primary }}
            >
              8
            </div>
            <div className="mt-1 text-sm opacity-80">Projects</div>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
            Featured Projects
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className="p-6"
              style={{ backgroundColor: theme.card, color: theme.text }}
            >
              <p
                className="text-lg font-semibold"
                style={{ color: theme.heading }}
              >
                Project management coming soon...
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
