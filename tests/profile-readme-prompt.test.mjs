import assert from "node:assert/strict";
import test from "node:test";

import {
  PROFILE_README_STYLES,
  buildProfileReadmePrompts,
} from "../src/lib/profile-readme-prompt.mjs";

const profileData = {
  user: {
    name: "Ada Lovelace",
    email: "ada@example.com",
  },
  flaregit: {
    githubUsername: "ada",
    bio: "Computing pioneer",
    specialization: "Analytical Engines",
    website: "https://example.com",
    featuredProjects: [
      {
        name: "Featured FlareGit",
        description: "A verified featured project",
        html_url: "https://github.com/ada/featured",
        language: "JavaScript",
      },
    ],
  },
  github: {
    repositories: {
      total: 4,
      totalStars: 42,
      top: [],
      languageDistribution: [{ name: "JavaScript", percentage: 70 }],
    },
    contributions: {
      total: 100,
      breakdown: { commits: 80, pullRequests: 10, issues: 5, reviews: 5 },
      trends: [],
    },
    skills: ["JavaScript"],
    specializations: ["Frontend Development"],
    activityLevel: "Active",
  },
};

test("builds a professional refinement prompt from existing README and verified data", () => {
  const { systemPrompt, userPrompt } = buildProfileReadmePrompts(
    profileData,
    { style: "professional" },
    "# About\n\nMy hand-written introduction"
  );

  assert.match(userPrompt, /My hand-written introduction/);
  assert.match(userPrompt, /Professional/);
  assert.match(userPrompt, /Featured FlareGit/);
  assert.match(userPrompt, /ada/);
  assert.match(systemPrompt, /never invent/i);
});

test("uses distinct style guidance and falls back to professional", () => {
  const bold = buildProfileReadmePrompts(profileData, { style: "bold" }, "");
  const minimal = buildProfileReadmePrompts(
    profileData,
    { style: "minimal" },
    ""
  );
  const fallback = buildProfileReadmePrompts(
    profileData,
    { style: "unsupported" },
    ""
  );

  assert.match(bold.userPrompt, /Bold/);
  assert.match(minimal.userPrompt, /Minimal/);
  assert.match(fallback.userPrompt, /Professional/);
  assert.notEqual(
    PROFILE_README_STYLES.bold.guidance,
    PROFILE_README_STYLES.minimal.guidance
  );
});
