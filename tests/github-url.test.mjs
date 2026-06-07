import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGitHubProfileUrl,
  buildGitHubProfileRepositoryUrl,
  getGitHubRepositoryUrl,
  normalizeGitHubOwner,
} from "../src/lib/github-url.mjs";

test("normalizes a GitHub owner from usernames and GitHub URLs", () => {
  assert.equal(normalizeGitHubOwner("octocat"), "octocat");
  assert.equal(normalizeGitHubOwner("@octocat"), "octocat");
  assert.equal(normalizeGitHubOwner("https://github.com/octocat/hello-world"), "octocat");
});

test("builds profile README repo URLs without duplicating owner paths", () => {
  assert.equal(
    buildGitHubProfileRepositoryUrl("octocat"),
    "https://github.com/octocat/octocat"
  );
  assert.equal(
    buildGitHubProfileRepositoryUrl("https://github.com/octocat/hello-world"),
    "https://github.com/octocat/octocat"
  );
});

test("builds GitHub account profile URLs without appending a repository", () => {
  assert.equal(buildGitHubProfileUrl("octocat"), "https://github.com/octocat");
  assert.equal(
    buildGitHubProfileUrl("https://github.com/octocat/hello-world"),
    "https://github.com/octocat"
  );
});

test("builds repository URLs from the best available project data", () => {
  assert.equal(
    getGitHubRepositoryUrl({ name: "hello-world" }, "octocat"),
    "https://github.com/octocat/hello-world"
  );
  assert.equal(
    getGitHubRepositoryUrl({ name: "octocat/hello-world" }, "octocat"),
    "https://github.com/octocat/hello-world"
  );
  assert.equal(
    getGitHubRepositoryUrl(
      { html_url: "https://github.com/octocat/hello-world", name: "ignored" },
      "octocat"
    ),
    "https://github.com/octocat/hello-world"
  );
});
