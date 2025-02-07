export class AIReadmeGenerator {
  constructor(apiEndpoint, apiKey) {
    if (!apiEndpoint || !apiKey) {
      throw new Error("AI API endpoint and key are required");
    }
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async generateReadme(profileData, preferences = {}) {
    try {
      const systemPrompt = `You are an expert GitHub README designer specializing in creating modern, visually stunning profile READMEs.
You MUST use ONLY GitHub-flavored Markdown syntax - DO NOT include any HTML or CSS.

Your task is to create a README that stands out using GitHub-flavored Markdown features:
- Use GitHub-flavored Markdown for all formatting
- Utilize GitHub's built-in alignment and formatting syntax
- Create visual appeal through strategic use of markdown elements
- Incorporate GitHub-supported badges and widgets
- Focus on clean, professional markdown structure

Guidelines for the README (using ONLY Markdown):
1. Use GitHub-flavored Markdown headers with emojis
2. Incorporate GitHub's built-in profile widgets and stats cards
3. Use markdown tables for structured layouts
4. Add badges using shields.io or similar services
5. Create clean section dividers using markdown syntax
6. Ensure proper markdown spacing and alignment
7. Use emojis strategically for visual appeal
8. Include GitHub-supported markdown features

The README should follow this structure (in Markdown):
1. Profile header with GitHub stats card
2. Brief, engaging introduction with badges
3. Skills section using shield.io badges
4. GitHub statistics using markdown tables
5. Featured projects with repository cards
6. Contribution graph using GitHub's built-in widget
7. Contact information with branded badges
8. Footer with profile views counter`;

      const userPrompt = `Create a professional GitHub profile README using ONLY GitHub-flavored Markdown (no HTML/CSS) with the following data:

User Information:
- Name: ${profileData.user.name}
- GitHub Username: ${profileData.flaregit.githubUsername}
- Bio: ${profileData.github?.bio || ""}
- Location: ${profileData.flaregit.location || ""}
- Website: ${profileData.flaregit.website || ""}
- Twitter: ${profileData.flaregit.twitter || ""}
- LinkedIn: ${profileData.flaregit.linkedin || ""}

GitHub Statistics:
- Total Repositories: ${profileData.github?.repositories?.total || 0}
- Total Stars: ${profileData.github?.repositories?.totalStars || 0}
- Total Contributions: ${profileData.github?.contributions?.total || 0}
- Top Languages: ${JSON.stringify(
        profileData.github?.repositories?.languageDistribution || []
      )}
- Activity Level: ${profileData.github?.activityLevel || ""}

Featured Projects:
${JSON.stringify(profileData.github?.repositories?.top || [], null, 2)}

Skills and Specializations:
${JSON.stringify(profileData.github?.skills || [], null, 2)}
${JSON.stringify(profileData.github?.specializations || [], null, 2)}

Style Preferences:
${JSON.stringify(preferences, null, 2)}

Requirements (USING ONLY GITHUB-FLAVORED MARKDOWN):
1. Use markdown headers with appropriate levels (#, ##, ###)
2. Include GitHub profile stats cards using markdown image syntax
3. Create tables using markdown syntax (|---|---|)
4. Add badges using shield.io markdown syntax
5. Ensure proper markdown spacing and formatting
6. Include GitHub activity widgets using markdown
7. Use appropriate emojis as bullet points
8. Add markdown-compatible links and images
9. Include GitHub achievement cards
10. Format for both light and dark themes using markdown

Example widgets to include (in markdown format):
- GitHub Stats Card: ![GitHub stats](https://github-readme-stats.vercel.app/api?username=USERNAME)
- Top Languages: ![Top Langs](https://github-readme-stats.vercel.app/api/top-langs/?username=USERNAME)
- Profile Views: ![Profile Views](https://komarev.com/ghpvc/?username=USERNAME)
- GitHub Streak: ![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=USERNAME)
- Activity Graph: ![Activity Graph](https://activity-graph.herokuapp.com/graph?username=USERNAME)

Replace USERNAME with the actual GitHub username in the final output.
DO NOT include any HTML or CSS - use ONLY GitHub-flavored Markdown syntax.`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-preview-02-05:free",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const readmeContent = data.choices?.[0]?.message?.content;

      if (!readmeContent) {
        throw new Error("No README content generated");
      }

      // Ensure the content is properly formatted as markdown
      const cleanedContent = readmeContent
        .replace(/<[^>]*>/g, "") // Remove any HTML tags
        .replace(/\n\s*\n/g, "\n\n"); // Fix spacing

      return cleanedContent;
    } catch (error) {
      console.error("Error generating README:", error);
      throw new Error(`Failed to generate README: ${error.message}`);
    }
  }

  async previewReadme(content) {
    try {
      const response = await fetch(`${this.apiEndpoint}/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a README preview generator that formats and enhances README content.",
            },
            {
              role: "user",
              content: content,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Preview request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const previewContent = data.choices?.[0]?.message?.content;

      if (!previewContent) {
        throw new Error("No preview content generated");
      }

      return previewContent;
    } catch (error) {
      console.error("Error generating README preview:", error);
      throw new Error(`Failed to generate README preview: ${error.message}`);
    }
  }
}
