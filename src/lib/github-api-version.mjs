export const GITHUB_API_VERSION = "2026-03-10";

export function withGitHubApiVersion(options = {}) {
  return {
    ...options,
    headers: {
      ...options.headers,
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  };
}
