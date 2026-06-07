import assert from "node:assert/strict";
import test from "node:test";

import {
  getProfileReadmeTarget,
  publishProfileReadme,
} from "../src/lib/github-readme-publisher.mjs";

test("uses the special username/username repository for profile README publishing", () => {
  assert.deepEqual(getProfileReadmeTarget("octocat"), {
    owner: "octocat",
    repo: "octocat",
  });
});

test("creates the profile repository when it does not exist before publishing README", async () => {
  const calls = [];
  const octokit = {
    rest: {
      repos: {
        get: async (args) => {
          calls.push(["get", args]);
          const error = new Error("Not found");
          error.status = 404;
          throw error;
        },
        createForAuthenticatedUser: async (args) => {
          calls.push(["createForAuthenticatedUser", args]);
        },
        getContent: async (args) => {
          calls.push(["getContent", args]);
          const error = new Error("README missing");
          error.status = 404;
          throw error;
        },
        createOrUpdateFileContents: async (args) => {
          calls.push(["createOrUpdateFileContents", args]);
          return { data: { content: { html_url: "https://github.com/octocat/octocat/blob/main/README.md" } } };
        },
      },
    },
  };

  const result = await publishProfileReadme({
    octokit,
    username: "octocat",
    content: "# Octocat",
  });

  assert.equal(
    result.url,
    "https://github.com/octocat/octocat/blob/main/README.md"
  );
  assert.equal(calls[0][0], "get");
  assert.equal(calls[0][1].owner, "octocat");
  assert.equal(calls[0][1].repo, "octocat");
  assert.deepEqual(calls[1], [
    "createForAuthenticatedUser",
    {
      name: "octocat",
      private: false,
      auto_init: true,
      description: "GitHub profile README for octocat",
      headers: {
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  ]);
  assert.equal(calls[3][0], "createOrUpdateFileContents");
  assert.equal(calls[3][1].path, "README.md");
  assert.equal(calls[3][1].message, "Update profile README via FlareGit");
  assert.equal(calls[0][1].headers["X-GitHub-Api-Version"], "2026-03-10");
  assert.equal(calls[1][1].headers["X-GitHub-Api-Version"], "2026-03-10");
  assert.equal(calls[2][1].headers["X-GitHub-Api-Version"], "2026-03-10");
  assert.equal(calls[3][1].headers["X-GitHub-Api-Version"], "2026-03-10");
  assert.ok(!("sha" in calls[3][1]));
});

test("updates an existing profile README using the current file sha", async () => {
  const calls = [];
  const octokit = {
    rest: {
      repos: {
        get: async (args) => calls.push(["get", args]),
        createForAuthenticatedUser: async (args) =>
          calls.push(["createForAuthenticatedUser", args]),
        getContent: async (args) => {
          calls.push(["getContent", args]);
          return { data: { sha: "abc123" } };
        },
        createOrUpdateFileContents: async (args) => {
          calls.push(["createOrUpdateFileContents", args]);
          return { data: { content: { html_url: "https://github.com/octocat/octocat/blob/main/README.md" } } };
        },
      },
    },
  };

  await publishProfileReadme({
    octokit,
    username: "octocat",
    content: "# Updated",
  });

  assert.equal(
    calls.some(([name]) => name === "createForAuthenticatedUser"),
    false
  );
  assert.equal(calls[2][1].sha, "abc123");
});

test("removes unreliable stats widgets before publishing a profile README", async () => {
  const calls = [];
  const octokit = {
    rest: {
      repos: {
        get: async (args) => calls.push(["get", args]),
        createForAuthenticatedUser: async (args) =>
          calls.push(["createForAuthenticatedUser", args]),
        getContent: async (args) => {
          calls.push(["getContent", args]);
          return { data: { sha: "abc123" } };
        },
        createOrUpdateFileContents: async (args) => {
          calls.push(["createOrUpdateFileContents", args]);
          return { data: { content: { html_url: "https://github.com/octocat/octocat/blob/main/README.md" } } };
        },
      },
    },
  };

  await publishProfileReadme({
    octokit,
    username: "octocat",
    content: `# Octocat

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=octocat&show_icons=true)

Still here.`,
  });

  const publishCall = calls.find(
    ([name]) => name === "createOrUpdateFileContents"
  );
  const publishedContent = Buffer.from(
    publishCall[1].content,
    "base64"
  ).toString("utf8");

  assert.doesNotMatch(publishedContent, /github-readme-stats/);
  assert.doesNotMatch(publishedContent, /GitHub Stats/);
  assert.match(publishedContent, /Still here\./);
});

test("makes an existing private profile README repository public before publishing", async () => {
  const calls = [];
  const octokit = {
    rest: {
      repos: {
        get: async (args) => {
          calls.push(["get", args]);
          return { data: { private: true } };
        },
        update: async (args) => calls.push(["update", args]),
        createForAuthenticatedUser: async (args) =>
          calls.push(["createForAuthenticatedUser", args]),
        getContent: async (args) => {
          calls.push(["getContent", args]);
          return { data: { sha: "abc123" } };
        },
        createOrUpdateFileContents: async (args) => {
          calls.push(["createOrUpdateFileContents", args]);
          return { data: { content: { html_url: "https://github.com/octocat/octocat/blob/main/README.md" } } };
        },
      },
    },
  };

  await publishProfileReadme({
    octokit,
    username: "octocat",
    content: "# Public profile",
  });

  const updateCall = calls.find(([name]) => name === "update");
  assert.deepEqual(updateCall, [
    "update",
    {
      owner: "octocat",
      repo: "octocat",
      private: false,
      headers: {
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  ]);
});
