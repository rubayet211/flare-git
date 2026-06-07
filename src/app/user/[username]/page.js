"use client";

import { useEffect, useState } from "react";
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
import { getGitHubRepositoryUrl } from "@/lib/github-url.mjs";

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

  const theme = profile?.customTheme || defaultTheme;
  const portfolio = profile?.portfolio || {};
  const portfolioProjects =
    Array.isArray(portfolio.projects) && portfolio.projects.length > 0
      ? portfolio.projects
      : profile?.featuredProjects || [];
  const portfolioStats = portfolio.stats || {};
  const languages = Array.isArray(portfolio.languages)
    ? portfolio.languages
    : [];

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
          <Card
            className="p-6"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5" style={{ color: theme.primary }} />
              <div>
                <p className="text-sm opacity-75">Repositories</p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: theme.heading }}
                >
                  {portfolioStats.totalRepos || portfolioProjects.length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className="p-6"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5" style={{ color: theme.primary }} />
              <div>
                <p className="text-sm opacity-75">Stars</p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: theme.heading }}
                >
                  {portfolioStats.totalStars || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className="p-6"
            style={{ backgroundColor: theme.card, color: theme.text }}
          >
            <div className="flex items-center gap-3">
              <GitFork className="h-5 w-5" style={{ color: theme.primary }} />
              <div>
                <p className="text-sm opacity-75">Forks</p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: theme.heading }}
                >
                  {portfolioStats.totalForks || 0}
                </p>
              </div>
            </div>
          </Card>
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

        {languages.length > 0 && (
          <div className="mb-12 space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              Languages
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {languages.slice(0, 8).map((language) => (
                <Card
                  key={language.name}
                  className="p-4"
                  style={{ backgroundColor: theme.card, color: theme.text }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{language.name}</span>
                    <span className="text-sm opacity-75">
                      {language.percentage}%
                    </span>
                  </div>
                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: `${theme.text}1A` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${language.percentage}%`,
                        backgroundColor: theme.primary,
                      }}
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
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              Featured Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {portfolioProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 flex flex-col h-full hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: theme.card, color: theme.text }}
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
