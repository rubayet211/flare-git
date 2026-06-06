"use client";

import { Github } from "lucide-react";
import { ProfileReadmePreview } from "@/components/profile-readme-preview";

export function ThemePreview({ theme, profile }) {
  return (
    <div
      className="rounded-lg border p-6"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      <div className="mb-6 flex items-center gap-4 border-b pb-5">
        <div
          className="h-16 w-16 overflow-hidden rounded-full border-4"
          style={{ borderColor: theme.primary }}
        >
          {profile?.image ? (
            <img
              src={profile.image}
              alt={profile.name || "Profile avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Github className="h-7 w-7" style={{ color: theme.primary }} />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: theme.heading }}>
              {profile?.name || "Your Name"}
            </h2>
            <p className="text-sm opacity-80">
              @{profile?.githubUsername || "username"}
            </p>
            {profile?.specialization && (
              <p className="mt-1 text-sm font-medium" style={{ color: theme.primary }}>
                {profile.specialization}
              </p>
            )}
          </div>
        </div>
      </div>

      <ProfileReadmePreview
        content={profile?.generatedReadme}
        theme={theme}
        className="p-5"
        emptyMessage="Generate and save a Profile README to preview it here."
      />
    </div>
  );
}
