import { getGitHubRepositoryUrl } from "./github-url.mjs";

const PROJECT_LIMIT = 6;

export function buildPortfolioData(profile, githubData = {}) {
  const githubUsername = profile?.githubUsername || "";
  const savedFeaturedProjects = Array.isArray(profile?.featuredProjects)
    ? profile.featuredProjects
    : [];
  const fetchedRepositories = Array.isArray(githubData.repositories)
    ? githubData.repositories
    : [];

  const sourceProjects =
    savedFeaturedProjects.length > 0
      ? savedFeaturedProjects
      : [...fetchedRepositories]
          .sort((a, b) => {
            const starDelta =
              (b?.stargazers_count || 0) - (a?.stargazers_count || 0);
            if (starDelta !== 0) {
              return starDelta;
            }
            return new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0);
          })
          .slice(0, PROJECT_LIMIT);

  const projects = sourceProjects.map((project) =>
    normalizePortfolioProject(project, githubUsername)
  );

  const statsSource =
    fetchedRepositories.length > 0 ? fetchedRepositories : sourceProjects;

  return {
    projects,
    languages: Array.isArray(githubData.languages) ? githubData.languages : [],
    contributions: githubData.contributions || null,
    trends: Array.isArray(githubData.trends) ? githubData.trends : [],
    stats: buildStats(statsSource, githubData.stats),
  };
}

function normalizePortfolioProject(project, githubUsername) {
  return {
    id: project?.id || project?.name,
    name: project?.name || "Untitled repository",
    description: project?.description || "",
    url: getGitHubRepositoryUrl(project, githubUsername),
    stargazers_count: project?.stargazers_count || project?.stars || 0,
    forks_count: project?.forks_count || project?.forks || 0,
    language: project?.language || "",
    topics: Array.isArray(project?.topics) ? project.topics : [],
    homepage: project?.homepage || "",
    updated_at: project?.updated_at || "",
  };
}

function buildStats(repositories, explicitStats) {
  if (explicitStats?.totalStats) {
    return {
      totalStars: explicitStats.totalStats.totalStars || 0,
      totalForks: explicitStats.totalStats.totalForks || 0,
      totalRepos: explicitStats.totalStats.totalRepos || repositories.length || 0,
    };
  }

  return repositories.reduce(
    (stats, repo) => ({
      totalStars:
        stats.totalStars + (repo?.stargazers_count || repo?.stars || 0),
      totalForks: stats.totalForks + (repo?.forks_count || repo?.forks || 0),
      totalRepos: stats.totalRepos + 1,
    }),
    { totalStars: 0, totalForks: 0, totalRepos: 0 }
  );
}
