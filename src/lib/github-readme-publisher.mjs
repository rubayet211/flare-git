import { normalizeGitHubOwner } from "./github-url.mjs";
import { withGitHubApiVersion } from "./github-api-version.mjs";

const README_PATH = "README.md";

export function getProfileReadmeTarget(username) {
  const owner = normalizeGitHubOwner(username);
  return {
    owner,
    repo: owner,
  };
}

export async function publishProfileReadme({ octokit, username, content }) {
  const { owner, repo } = getProfileReadmeTarget(username);
  if (!owner) {
    throw new Error("GitHub username is required");
  }

  await ensureRepositoryExists({ octokit, owner, repo });

  return publishRepositoryReadme({
    octokit,
    owner,
    repo,
    content,
    message: "Update profile README via FlareGit",
  });
}

export async function publishRepositoryReadme({
  octokit,
  owner,
  repo,
  content,
  message = "Update README.md via FlareGit",
}) {
  if (!octokit) {
    throw new Error("GitHub client is required");
  }
  if (!owner || !repo) {
    throw new Error("GitHub owner and repository are required");
  }
  if (!content?.trim()) {
    throw new Error("README content is required");
  }

  const sha = await getExistingReadmeSha({ octokit, owner, repo });
  const payload = {
    owner,
    repo,
    path: README_PATH,
    message,
    content: Buffer.from(content).toString("base64"),
  };

  if (sha) {
    payload.sha = sha;
  }

  const response = await octokit.rest.repos.createOrUpdateFileContents(
    withGitHubApiVersion(payload)
  );

  return {
    owner,
    repo,
    path: README_PATH,
    url: response?.data?.content?.html_url || `https://github.com/${owner}/${repo}`,
  };
}

async function ensureRepositoryExists({ octokit, owner, repo }) {
  try {
    await octokit.rest.repos.get(withGitHubApiVersion({ owner, repo }));
  } catch (error) {
    if (error.status !== 404) {
      throw error;
    }

    await octokit.rest.repos.createForAuthenticatedUser(
      withGitHubApiVersion({
        name: repo,
        private: false,
        auto_init: false,
        description: `GitHub profile README for ${owner}`,
      })
    );
  }
}

async function getExistingReadmeSha({ octokit, owner, repo }) {
  try {
    const { data } = await octokit.rest.repos.getContent(
      withGitHubApiVersion({
        owner,
        repo,
        path: README_PATH,
      })
    );
    return data?.sha;
  } catch (error) {
    if (error.status === 404) {
      return undefined;
    }
    throw error;
  }
}
