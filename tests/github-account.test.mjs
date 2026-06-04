import assert from "node:assert/strict";
import test from "node:test";

import { persistGitHubAccountCredentials } from "../src/lib/github-account.mjs";

test("persists the latest credentials for an existing GitHub account", async () => {
  const calls = [];
  const prisma = {
    account: {
      update: async (args) => {
        calls.push(args);
      },
    },
  };

  await persistGitHubAccountCredentials(prisma, {
    provider: "github",
    providerAccountId: "123",
    access_token: "new-token",
    token_type: "bearer",
    scope: "read:user,user:email,repo",
  });

  assert.deepEqual(calls, [
    {
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: "123",
        },
      },
      data: {
        access_token: "new-token",
        token_type: "bearer",
        scope: "read:user,user:email,repo",
      },
    },
  ]);
});
