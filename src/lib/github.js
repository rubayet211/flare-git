import { Octokit } from "octokit";

export class GitHubService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error("GitHub access token is required");
    }
    this.octokit = new Octokit({ auth: accessToken });
  }

  async getRepositories(username) {
    try {
      const { data } = await this.octokit.rest.repos.listForUser({
        username,
        sort: "updated",
        per_page: 100,
        type: "owner",
      });

      return data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        topics: repo.topics || [],
        language: repo.language,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        homepage: repo.homepage,
        is_template: repo.is_template,
        visibility: repo.visibility,
      }));
    } catch (error) {
      console.error("Error fetching repositories:", error);
      if (error.status === 401) {
        throw new Error("GitHub authentication failed");
      }
      if (error.status === 404) {
        return []; // Return empty array if user not found
      }
      throw error;
    }
  }

  async getContributions(username) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              totalCommitContributions
              totalIssueContributions
              totalPullRequestContributions
              totalPullRequestReviewContributions
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      const { data } = await this.octokit.graphql(query, { username });

      // Check if data and user exist
      if (!data || !data.user) {
        return {
          totalCommitContributions: 0,
          totalIssueContributions: 0,
          totalPullRequestContributions: 0,
          totalPullRequestReviewContributions: 0,
          contributionCalendar: {
            totalContributions: 0,
            weeks: [],
          },
        };
      }

      return data.user.contributionsCollection;
    } catch (error) {
      console.error("Error fetching contributions:", error);
      // Return default structure on error
      return {
        totalCommitContributions: 0,
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        contributionCalendar: {
          totalContributions: 0,
          weeks: [],
        },
      };
    }
  }

  async getLanguages(username) {
    try {
      const repos = await this.getRepositories(username);
      const languages = {};

      await Promise.all(
        repos.map(async (repo) => {
          try {
            const { data } = await this.octokit.rest.repos.listLanguages({
              owner: username,
              repo: repo.name,
            });

            Object.entries(data).forEach(([lang, bytes]) => {
              languages[lang] = (languages[lang] || 0) + bytes;
            });
          } catch (error) {
            console.error(`Error fetching languages for ${repo.name}:`, error);
          }
        })
      );

      // Convert bytes to percentages
      const total = Object.values(languages).reduce((a, b) => a + b, 0);
      const percentages = Object.entries(languages).map(([lang, bytes]) => ({
        name: lang,
        percentage: Math.round((bytes / total) * 100),
      }));

      return percentages.sort((a, b) => b.percentage - a.percentage);
    } catch (error) {
      console.error("Error fetching languages:", error);
      throw error;
    }
  }

  async getRepositoryStats(username) {
    try {
      const repos = await this.getRepositories(username);

      // Calculate total stats
      const totalStats = repos.reduce(
        (acc, repo) => ({
          totalStars: acc.totalStars + repo.stargazers_count,
          totalForks: acc.totalForks + repo.forks_count,
          totalRepos: acc.totalRepos + 1,
        }),
        { totalStars: 0, totalForks: 0, totalRepos: 0 }
      );

      // Get top repositories by stars
      const topRepos = [...repos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map((repo) => ({
          name: repo.name,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        }));

      return {
        totalStats,
        topRepos,
      };
    } catch (error) {
      console.error("Error fetching repository stats:", error);
      throw error;
    }
  }

  async getContributionTrends(username) {
    try {
      const query = `
        query($username: String!) {
          user(login: $username) {
            contributionsCollection {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `;

      const { data } = await this.octokit.graphql(query, { username });

      // Check if data and user exist
      if (!data || !data.user || !data.user.contributionsCollection) {
        return [];
      }

      const weeks =
        data.user.contributionsCollection.contributionCalendar.weeks;

      // Group contributions by month
      const monthlyContributions = weeks.reduce((acc, week) => {
        week.contributionDays.forEach((day) => {
          const date = new Date(day.date);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          acc[monthKey] = (acc[monthKey] || 0) + day.contributionCount;
        });
        return acc;
      }, {});

      // Convert to array and sort by date
      return Object.entries(monthlyContributions)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-12); // Last 12 months
    } catch (error) {
      console.error("Error fetching contribution trends:", error);
      return []; // Return empty array on error
    }
  }

  async getTrafficStats(username, repoName) {
    try {
      const { data: views } = await this.octokit.rest.repos.getViews({
        owner: username,
        repo: repoName,
      });

      const { data: clones } = await this.octokit.rest.repos.getClones({
        owner: username,
        repo: repoName,
      });

      return {
        views: views.views || [],
        clones: clones.clones || [],
      };
    } catch (error) {
      console.error("Error fetching traffic stats:", error);
      throw error;
    }
  }

  async getRepositoryReadme(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
        mediaType: {
          format: "raw",
        },
      });
      return data;
    } catch (error) {
      if (error.status === 404) {
        return ""; // Return empty string if README doesn't exist
      }
      throw error;
    }
  }

  async getRepositoryFiles(owner, repo) {
    try {
      const { data: tree } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: "main", // Try main branch first
        recursive: true,
      });

      // Filter out binary files and large files
      return tree.tree
        .filter(
          (file) =>
            file.type === "blob" &&
            file.size < 1000000 && // Less than 1MB
            !file.path.match(
              /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i
            )
        )
        .map((file) => ({
          path: file.path,
          size: file.size,
          type: file.type,
          url: file.url,
        }));
    } catch (error) {
      if (error.status === 404) {
        // Try 'master' branch if 'main' doesn't exist
        try {
          const { data: tree } = await this.octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha: "master",
            recursive: true,
          });

          return tree.tree
            .filter(
              (file) =>
                file.type === "blob" &&
                file.size < 1000000 &&
                !file.path.match(
                  /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i
                )
            )
            .map((file) => ({
              path: file.path,
              size: file.size,
              type: file.type,
              url: file.url,
            }));
        } catch (masterError) {
          return []; // Return empty array if neither branch exists
        }
      }
      throw error;
    }
  }

  async updateRepositoryReadme(owner, repo, content) {
    try {
      // First, try to get the current README to get its SHA
      let sha;
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: "README.md",
        });
        sha = data.sha;
      } catch (error) {
        // If README doesn't exist, sha will remain undefined
      }

      // Update or create the README
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: "README.md",
        message: "Update README.md via FlareGit",
        content: Buffer.from(content).toString("base64"),
        sha, // Will create new file if sha is undefined
      });
    } catch (error) {
      console.error("Error updating README:", error);
      throw error;
    }
  }
}
