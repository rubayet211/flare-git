const GITHUB_HOST = "github.com";

export function normalizeGitHubOwner(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/^@/, "");
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.replace(/^www\./, "").toLowerCase() === GITHUB_HOST) {
      return sanitizePathPart(url.pathname.split("/").filter(Boolean)[0]);
    }
  } catch {
    // Plain usernames are handled below.
  }

  return sanitizePathPart(trimmed.split("/").filter(Boolean)[0]);
}

export function buildGitHubProfileRepositoryUrl(githubUsername) {
  const owner = normalizeGitHubOwner(githubUsername);
  return owner ? `https://github.com/${owner}/${owner}` : "";
}

export function buildGitHubProfileUrl(githubUsername) {
  const owner = normalizeGitHubOwner(githubUsername);
  return owner ? `https://github.com/${owner}` : "";
}

export function getGitHubRepositoryUrl(project, fallbackOwner) {
  if (project?.html_url && isSafeGitHubUrl(project.html_url)) {
    return project.html_url;
  }

  if (project?.url && isSafeGitHubUrl(project.url)) {
    return project.url;
  }

  const fullName = project?.full_name || project?.name;
  if (typeof fullName === "string") {
    const parts = fullName.split("/").filter(Boolean).map(sanitizePathPart);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `https://github.com/${parts[0]}/${parts[1]}`;
    }

    const owner = normalizeGitHubOwner(fallbackOwner);
    const repo = sanitizePathPart(fullName);
    if (owner && repo) {
      return `https://github.com/${owner}/${repo}`;
    }
  }

  return "";
}

function isSafeGitHubUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.replace(/^www\./, "").toLowerCase() === GITHUB_HOST
    );
  } catch {
    return false;
  }
}

function sanitizePathPart(value) {
  return String(value || "").trim().replace(/^@/, "").replace(/[^A-Za-z0-9_.-]/g, "");
}
