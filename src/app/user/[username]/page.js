"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { ProfileReadmePreview } from "@/components/profile-readme-preview";
import {
  Github,
  Twitter,
  Linkedin,
  Globe,
  Star,
  GitFork,
  BookOpen,
} from "lucide-react";
import {
  buildGitHubProfileUrl,
  getGitHubRepositoryUrl,
} from "@/lib/github-url.mjs";

export default function ProfilePage({ params }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${params.username}`);
        if (!response.ok) {
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

  if (!profile) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
        <Card className="max-w-md p-8 text-center">
          <Github className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Profile not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This portfolio is not published yet or the username is incorrect.
          </p>
        </Card>
      </div>
    );
  }

  // Use the profile's primary accent color if set, otherwise fall back to the CSS variable
  const accentColor = profile?.customTheme?.primary || null;
  const accentStyle = accentColor ? { color: accentColor } : {};
  const accentBorderStyle = accentColor ? { borderColor: accentColor } : {};
  const accentBgStyle = accentColor
    ? { backgroundColor: `${accentColor}1A`, color: accentColor }
    : {};

  const isDark = mounted && resolvedTheme === "dark";

  const portfolio = profile?.portfolio || {};
  const portfolioProjects =
    Array.isArray(portfolio.projects) && portfolio.projects.length > 0
      ? portfolio.projects
      : profile?.featuredProjects || [];
  const portfolioStats = portfolio.stats || {};
  const languages = Array.isArray(portfolio.languages)
    ? portfolio.languages
    : [];

  const githubProfileUrl = buildGitHubProfileUrl(profile?.githubUsername);
  const primaryLanguage = languages[0]?.name || "Not enough language data";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-10">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="h-24 w-24 overflow-hidden rounded-full border-4 border-primary"
              style={accentBorderStyle}
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
                    className="h-10 w-10 text-primary"
                    style={accentStyle}
                  />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {profile?.name}
              </h1>
              <p className="text-lg text-muted-foreground">@{profile?.githubUsername}</p>
              {profile?.company && (
                <p className="mt-1 flex items-center text-sm text-muted-foreground">
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
              <h2 className="text-xl font-medium mb-2 text-muted-foreground">{profile.specialization}</h2>
            )}
            <p className="text-lg leading-relaxed text-foreground">
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
              className="text-primary hover:opacity-80"
              style={accentStyle}
            >
              <Twitter className="h-6 w-6" />
            </a>
          )}
          {profile?.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:opacity-80"
              style={accentStyle}
            >
              <Linkedin className="h-6 w-6" />
            </a>
          )}
          {profile?.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:opacity-80"
              style={accentStyle}
            >
              <Globe className="h-6 w-6" />
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" style={accentStyle} />
              <div>
                <p className="text-sm text-muted-foreground">Repositories</p>
                <p className="text-2xl font-semibold text-foreground">
                  {portfolioStats.totalRepos || portfolioProjects.length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-primary" style={accentStyle} />
              <div>
                <p className="text-sm text-muted-foreground">Stars</p>
                <p className="text-2xl font-semibold text-foreground">
                  {portfolioStats.totalStars || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <GitFork className="h-5 w-5 text-primary" style={accentStyle} />
              <div>
                <p className="text-sm text-muted-foreground">Forks</p>
                <p className="text-2xl font-semibold text-foreground">
                  {portfolioStats.totalForks || 0}
                </p>
              </div>
            </div>
          </Card>
          {profile?.githubUsername && (
            <Card className="col-span-full p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Github
                    className="mt-1 h-5 w-5 text-primary"
                    style={accentStyle}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      GitHub Activity
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Public repository activity for @{profile.githubUsername}
                    </p>
                  </div>
                </div>
                {githubProfileUrl && (
                  <a
                    href={githubProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    style={accentStyle}
                  >
                    <Github className="h-4 w-4" />
                    View GitHub profile
                  </a>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Repositories</p>
                  <p className="text-lg font-semibold text-foreground">
                    {portfolioStats.totalRepos || portfolioProjects.length || 0}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Stars</p>
                  <p className="text-lg font-semibold text-foreground">
                    {portfolioStats.totalStars || 0}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Forks</p>
                  <p className="text-lg font-semibold text-foreground">
                    {portfolioStats.totalForks || 0}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Top language</p>
                  <p className="truncate text-lg font-semibold text-foreground">
                    {primaryLanguage}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {languages.length > 0 && (
          <div className="mb-12 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Languages
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {languages.slice(0, 8).map((language) => (
                <Card
                  key={language.name}
                  className="p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{language.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {language.percentage}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={accentColor ? { backgroundColor: accentColor } : {}}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {portfolioProjects.length > 0 && (
          <div className="space-y-6 mb-12">
            <h2 className="text-2xl font-bold text-foreground">
              Featured Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {portfolioProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 flex flex-col h-full hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <a 
                        href={
                          project.url ||
                          getGitHubRepositoryUrl(
                            project,
                            profile.githubUsername
                          )
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-semibold hover:underline text-primary"
                        style={accentStyle}
                      >
                        {project.name}
                      </a>
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <span className="flex items-center"><Star className="w-4 h-4 mr-1"/> {project.stargazers_count || 0}</span>
                        <span className="flex items-center"><GitFork className="w-4 h-4 mr-1"/> {project.forks_count || 0}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{project.description || "No description provided."}</p>
                  </div>
                  {project.language && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <span
                        className="text-sm font-medium px-2 py-1 rounded bg-primary/10 text-primary"
                        style={accentBgStyle}
                      >
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
            <h2 className="text-2xl font-bold text-foreground">
              About
            </h2>
            <Card className="p-8 overflow-hidden">
              <ProfileReadmePreview
                content={profile.generatedReadme}
                theme={{
                  primary: accentColor || "#3b82f6",
                  background: isDark ? "#0a0f1a" : "#ffffff",
                  card: isDark ? "#111827" : "#f8fafc",
                  text: isDark ? "#e2e8f0" : "#1e293b",
                  heading: isDark ? "#f1f5f9" : "#0f172a",
                }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
