"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ProfileReadmePreview } from "@/components/profile-readme-preview";
import { Github, Twitter, Linkedin, Globe, Star, GitFork } from "lucide-react";

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
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
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
                <div className="flex h-full w-full items-center justify-center bg-muted">
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
        {(profile?.aiGeneratedBio || profile?.bio) && (
          <div className="mb-8 max-w-3xl">
            {profile?.specialization && (
              <h2 className="text-xl font-medium mb-2 opacity-90">{profile.specialization}</h2>
            )}
            <p className="text-lg leading-relaxed" style={{ color: theme.text }}>
              {profile.aiGeneratedBio || profile.bio}
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
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile?.githubUsername && (
            <Card
              className="p-6 col-span-full overflow-hidden"
              style={{ backgroundColor: theme.card, color: theme.text }}
            >
              <h3 className="font-semibold mb-4" style={{ color: theme.heading }}>GitHub Activity</h3>
              <div className="flex justify-center">
                <img 
                  src={`https://github-readme-stats.vercel.app/api?username=${profile.githubUsername}&show_icons=true&theme=transparent&hide_border=true&title_color=${theme.primary.replace('#', '')}&text_color=${theme.text.replace('#', '')}&icon_color=${theme.primary.replace('#', '')}`}
                  alt="GitHub Stats" 
                  className="max-w-full h-auto"
                />
              </div>
            </Card>
          )}
        </div>

        {/* Projects Section */}
        {profile?.featuredProjects && profile.featuredProjects.length > 0 && (
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              Featured Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {profile.featuredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 flex flex-col h-full hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: theme.card, color: theme.text }}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <a 
                        href={project.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-semibold hover:underline"
                        style={{ color: theme.primary }}
                      >
                        {project.name}
                      </a>
                      <div className="flex items-center space-x-3 text-sm opacity-80">
                        <span className="flex items-center"><Star className="w-4 h-4 mr-1"/> {project.stargazers_count || 0}</span>
                        <span className="flex items-center"><GitFork className="w-4 h-4 mr-1"/> {project.forks_count || 0}</span>
                      </div>
                    </div>
                    <p className="opacity-90 mb-4">{project.description || "No description provided."}</p>
                  </div>
                  {project.language && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: `${theme.text}1A` }}>
                      <span className="text-sm font-medium px-2 py-1 rounded" style={{ backgroundColor: `${theme.primary}1A`, color: theme.primary }}>
                        {project.language}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Profile README */}
        {profile?.generatedReadme && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              About
            </h2>
            <Card className="p-8 overflow-hidden" style={{ backgroundColor: theme.card, color: theme.text }}>
              <ProfileReadmePreview
                content={profile.generatedReadme}
                theme={theme}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
