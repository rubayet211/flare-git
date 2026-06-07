import assert from "node:assert/strict";
import test from "node:test";

import { buildPortfolioData } from "../src/lib/portfolio-data.mjs";

test("uses saved featured projects first and normalizes project URLs", () => {
  const portfolio = buildPortfolioData({
    githubUsername: "octocat",
    featuredProjects: [
      {
        id: 1,
        name: "hello-world",
        description: "Example repo",
        stargazers_count: 12,
        forks_count: 3,
      },
    ],
  });

  assert.equal(portfolio.projects.length, 1);
  assert.equal(portfolio.projects[0].url, "https://github.com/octocat/hello-world");
  assert.equal(portfolio.stats.totalStars, 12);
  assert.equal(portfolio.stats.totalForks, 3);
});

test("falls back to top GitHub repositories when no projects are featured", () => {
  const portfolio = buildPortfolioData(
    { githubUsername: "octocat", featuredProjects: [] },
    {
      repositories: [
        { id: 1, name: "small", stargazers_count: 1, forks_count: 0 },
        { id: 2, name: "popular", stargazers_count: 20, forks_count: 5 },
      ],
      languages: [{ name: "JavaScript", percentage: 80 }],
    }
  );

  assert.deepEqual(
    portfolio.projects.map((project) => project.name),
    ["popular", "small"]
  );
  assert.equal(portfolio.languages[0].name, "JavaScript");
  assert.equal(portfolio.stats.totalRepos, 2);
});
