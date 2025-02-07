import { GitHubService } from "./github";

export class GitHubProfileAnalyzer {
  constructor(accessToken) {
    this.githubService = new GitHubService(accessToken);
  }

  async collectProfileData(username) {
    try {
      // Collect all GitHub data in parallel
      const [repositories, contributions, languages, stats, trends] =
        await Promise.all([
          this.githubService.getRepositories(username),
          this.githubService.getContributions(username),
          this.githubService.getLanguages(username),
          this.githubService.getRepositoryStats(username),
          this.githubService.getContributionTrends(username),
        ]);

      // Process repositories data
      const processedRepos = repositories.map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics,
        isTemplate: repo.is_template,
        visibility: repo.visibility,
        updatedAt: repo.updated_at,
      }));

      // Sort repositories by stars
      const topRepositories = [...processedRepos]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 6);

      // Calculate total contributions
      const totalContributions =
        contributions.contributionCalendar.totalContributions;
      const contributionBreakdown = {
        commits: contributions.totalCommitContributions,
        pullRequests: contributions.totalPullRequestContributions,
        issues: contributions.totalIssueContributions,
        reviews: contributions.totalPullRequestReviewContributions,
      };

      // Process language statistics
      const topLanguages = languages
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 8);

      // Process contribution trends
      const recentTrends = trends.slice(-6);

      // Compile complete profile data
      return {
        repositories: {
          total: processedRepos.length,
          top: topRepositories,
          languageDistribution: topLanguages,
          totalStars: stats.totalStats.totalStars,
          totalForks: stats.totalStats.totalForks,
        },
        contributions: {
          total: totalContributions,
          breakdown: contributionBreakdown,
          trends: recentTrends,
        },
        skills: this.extractSkillsFromRepositories(processedRepos),
        activityLevel: this.calculateActivityLevel(
          contributionBreakdown,
          recentTrends
        ),
        specializations: this.determineSpecializations(
          topLanguages,
          processedRepos
        ),
      };
    } catch (error) {
      console.error("Error collecting GitHub profile data:", error);
      throw error;
    }
  }

  extractSkillsFromRepositories(repositories) {
    // Extract unique topics and languages
    const skillsSet = new Set();

    repositories.forEach((repo) => {
      if (repo.language) skillsSet.add(repo.language);
      repo.topics?.forEach((topic) => skillsSet.add(topic));
    });

    // Convert to array and filter out common non-skill topics
    const nonSkillTopics = new Set(["project", "website", "app", "template"]);
    return Array.from(skillsSet)
      .filter((skill) => !nonSkillTopics.has(skill.toLowerCase()))
      .sort();
  }

  calculateActivityLevel(contributions, trends) {
    const totalActions = Object.values(contributions).reduce(
      (a, b) => a + b,
      0
    );
    const recentActivity = trends.reduce((sum, t) => sum + t.count, 0);

    if (totalActions > 1000 && recentActivity > 100) return "Very Active";
    if (totalActions > 500 && recentActivity > 50) return "Active";
    if (totalActions > 100 && recentActivity > 10) return "Moderately Active";
    return "Learning";
  }

  determineSpecializations(languages, repositories) {
    const specializations = [];

    // Check for frontend specialization
    const frontendTechs = [
      "JavaScript",
      "TypeScript",
      "React",
      "Vue",
      "Angular",
      "CSS",
      "HTML",
    ];
    const hasFrontendFocus =
      languages.some((lang) => frontendTechs.includes(lang.name)) &&
      repositories.some((repo) =>
        repo.topics?.some((topic) =>
          frontendTechs
            .map((t) => t.toLowerCase())
            .includes(topic.toLowerCase())
        )
      );
    if (hasFrontendFocus) specializations.push("Frontend Development");

    // Check for backend specialization
    const backendTechs = [
      "Node.js",
      "Python",
      "Java",
      "Go",
      "Ruby",
      "PHP",
      "C#",
    ];
    const hasBackendFocus =
      languages.some((lang) => backendTechs.includes(lang.name)) &&
      repositories.some((repo) =>
        repo.topics?.some((topic) =>
          backendTechs.map((t) => t.toLowerCase()).includes(topic.toLowerCase())
        )
      );
    if (hasBackendFocus) specializations.push("Backend Development");

    // Check for mobile development
    const mobileTechs = ["Swift", "Kotlin", "Java", "React Native", "Flutter"];
    const hasMobileFocus = repositories.some((repo) =>
      repo.topics?.some((topic) =>
        mobileTechs.map((t) => t.toLowerCase()).includes(topic.toLowerCase())
      )
    );
    if (hasMobileFocus) specializations.push("Mobile Development");

    // Check for DevOps
    const devOpsTechs = [
      "Docker",
      "Kubernetes",
      "AWS",
      "CI/CD",
      "Jenkins",
      "Terraform",
    ];
    const hasDevOpsFocus = repositories.some((repo) =>
      repo.topics?.some((topic) =>
        devOpsTechs.map((t) => t.toLowerCase()).includes(topic.toLowerCase())
      )
    );
    if (hasDevOpsFocus) specializations.push("DevOps");

    // Check for Data Science
    const dataScienceTechs = [
      "Python",
      "R",
      "Jupyter",
      "TensorFlow",
      "PyTorch",
      "Machine Learning",
    ];
    const hasDataScienceFocus = repositories.some((repo) =>
      repo.topics?.some((topic) =>
        dataScienceTechs
          .map((t) => t.toLowerCase())
          .includes(topic.toLowerCase())
      )
    );
    if (hasDataScienceFocus) specializations.push("Data Science");

    return specializations;
  }
}
