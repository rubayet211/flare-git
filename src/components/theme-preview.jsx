"use client";

import { Card } from "@/components/ui/card";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";

export function ThemePreview({ theme, profile }) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="h-20 w-20 overflow-hidden rounded-full border-4"
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
                <Github className="h-8 w-8" style={{ color: theme.primary }} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              {profile?.name || "Your Name"}
            </h2>
            <p className="text-sm opacity-80">
              @{profile?.githubUsername || "username"}
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <p style={{ color: theme.text }}>
          {profile?.bio ||
            "Your bio will appear here. Tell the world about yourself!"}
        </p>
      </div>

      {/* Social Links */}
      <div className="mb-6 flex space-x-4">
        {profile?.twitter && (
          <a
            href={`https://twitter.com/${profile.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80"
            style={{ color: theme.primary }}
          >
            <Twitter className="h-5 w-5" />
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
            <Linkedin className="h-5 w-5" />
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
            <Globe className="h-5 w-5" />
          </a>
        )}
      </div>

      {/* Stats Preview */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className="p-4 text-center"
          style={{ backgroundColor: theme.card, color: theme.text }}
        >
          <div className="text-2xl font-bold" style={{ color: theme.primary }}>
            12
          </div>
          <div className="text-sm opacity-80">Repositories</div>
        </Card>
        <Card
          className="p-4 text-center"
          style={{ backgroundColor: theme.card, color: theme.text }}
        >
          <div className="text-2xl font-bold" style={{ color: theme.primary }}>
            1.2k
          </div>
          <div className="text-sm opacity-80">Contributions</div>
        </Card>
        <Card
          className="p-4 text-center"
          style={{ backgroundColor: theme.card, color: theme.text }}
        >
          <div className="text-2xl font-bold" style={{ color: theme.primary }}>
            8
          </div>
          <div className="text-sm opacity-80">Projects</div>
        </Card>
      </div>
    </div>
  );
}
