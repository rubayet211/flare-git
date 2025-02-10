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
      const formatLanguages = (languages) => {
        if (!languages || !Array.isArray(languages))
          return "No language data available";
        return languages
          .map((lang) => `- ${lang.name}: ${lang.percentage}%`)
          .join("\n");
      };

      const formatProjects = (projects) => {
        if (!projects || !Array.isArray(projects))
          return "No featured projects available";
        return projects
          .map(
            (project) => `
### ${project.name || "Untitled Project"}
${project.description || "No description available"}
${project.url ? `🔗 [View Project](${project.url})` : ""}
${project.language ? `\n**Language:** ${project.language}` : ""}
${project.stars ? `⭐ Stars: ${project.stars}` : ""} ${
              project.forks ? `🔱 Forks: ${project.forks}` : ""
            }
${
  project.topics && project.topics.length > 0
    ? `\n**Topics:** ${project.topics.join(", ")}`
    : ""
}
`
          )
          .join("\n");
      };

      const systemPrompt = `You are a README.md generator that creates professional and visually appealing GitHub profile READMEs.
Your task is to create a README that follows proper markdown formatting and spacing rules:

FORMATTING RULES:
1. Always add blank lines between sections
2. Ensure proper heading hierarchy with spaces:
   \`\`\`
   # Heading 1
   
   ## Heading 2
   
   ### Heading 3
   \`\`\`
3. Use proper list formatting with blank lines:
   \`\`\`
   - Item 1
   - Item 2
   - Item 3
   \`\`\`
4. Center content with HTML:
   \`\`\`
   <div align="center">
   
   Content here
   
   </div>
   \`\`\`
5. Add proper spacing for badges:
   \`\`\`
   [![Badge1](url1)](link1) [![Badge2](url2)](link2)
   \`\`\`
6. Use HTML comments for section breaks:
   \`\`\`
   <!-- Section Title -->
   \`\`\`

REQUIRED SECTIONS:
1. Header Banner (centered):
   - Name in large text
   - Title/Role
   - Profile views counter
   - Social badges

2. About Me:
   - Brief introduction
   - Current focus/interests
   - Key skills/specialties

3. Skills & Tech Stack:
   - Organized badge grid
   - Category grouping
   - Consistent badge styling

4. GitHub Statistics:
   - Stats card
   - Language distribution
   - Contribution graph
   - Trophy showcase

5. Featured Projects:
   - Project cards
   - Tech stack badges
   - Brief descriptions

6. Activity Graph:
   - Contribution timeline
   - Recent activity

7. Connect Section:
   - Social media links
   - Contact information`;

      const userPrompt = `Please generate a GitHub profile README.md with the following information:

User Information:
- Name: ${profileData.user?.name || "Anonymous"}
- GitHub Username: ${profileData.flaregit?.githubUsername || "Not provided"}
- Bio: ${profileData.user?.bio || "No bio provided"}
- Location: ${profileData.flaregit?.location || "Not specified"}
- Website: ${profileData.flaregit?.website || "Not provided"}
- Twitter: ${profileData.flaregit?.twitter || "Not provided"}
- LinkedIn: ${profileData.flaregit?.linkedin || "Not provided"}

GitHub Statistics:
- Total Repositories: ${profileData.github?.repositories?.total || 0}
- Total Stars: ${profileData.github?.repositories?.totalStars || 0}
- Total Contributions: ${profileData.github?.contributions?.total || 0}
- Activity Level: ${profileData.github?.activityLevel || "Not available"}

Language Distribution:
${formatLanguages(profileData.github?.repositories?.languageDistribution)}

Featured Projects:
${formatProjects(profileData.github?.repositories?.top)}

Skills:
${
  profileData.github?.skills?.length > 0
    ? profileData.github.skills.map((skill) => `- ${skill}`).join("\n")
    : "No skills data available"
}

Specializations:
${
  profileData.github?.specializations?.length > 0
    ? profileData.github.specializations.map((spec) => `- ${spec}`).join("\n")
    : "No specialization data available"
}

Recent Contributions:
${
  profileData.github?.contributions?.trends
    ? "Last 6 months: " +
      profileData.github.contributions.trends
        .map((t) => `${t.date}: ${t.count} contributions`)
        .join(", ")
    : "No recent contribution data available"
}

Contribution Breakdown:
${
  profileData.github?.contributions?.breakdown
    ? Object.entries(profileData.github.contributions.breakdown)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n")
    : "No contribution breakdown available"
}

Please create a professional README.md that highlights these achievements and makes the profile stand out.
Use appropriate emojis, badges, and formatting to make it visually appealing.
Ensure proper spacing and section organization.
Add relevant GitHub widgets and stats cards where appropriate.`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-distill-llama-70b:free",
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

      // Clean up the markdown content
      const cleanedContent = readmeContent
        .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
        .replace(/\n\s*\n/g, "\n\n") // Standardize spacing between sections
        .replace(/(\n#{1,})/g, "\n\n$1") // Add proper spacing before headers
        .replace(/(\n<div)/g, "\n\n<div") // Add proper spacing before divs
        .replace(/(<\/div>)\n/g, "$1\n\n") // Add proper spacing after divs
        .replace(/!\[([^\]]+)\]\(([^)]+)\)(?!\n\n)/g, "![$1]($2)\n\n") // Add proper spacing after images
        .trim();

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
          model: "deepseek/deepseek-r1-distill-llama-70b:free",
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

  async generateRepositoryReadme(repository, existingReadme, files) {
    try {
      const systemPrompt = `You are a technical documentation expert specializing in creating comprehensive and well-structured GitHub repository READMEs.
Your task is to analyze the repository data and generate an enhanced README.md that follows best practices:

FORMATTING RULES:
1. Use clear section hierarchy with proper spacing
2. Include relevant badges (build status, version, license)
3. Add descriptive code blocks with proper language syntax
4. Use tables for complex data presentation
5. Include visual elements (architecture diagrams, screenshots) placeholders

REQUIRED SECTIONS:
1. Project Title & Description:
   - Clear, concise project name
   - Brief description of purpose
   - Key features
   - Status badges

2. Technologies & Dependencies:
   - List of main technologies
   - Framework versions
   - System requirements

3. Getting Started:
   - Prerequisites
   - Installation steps
   - Basic configuration
   - Quick start example

4. Usage:
   - Common use cases
   - Code examples
   - API documentation
   - Configuration options

5. Project Structure:
   - Directory layout
   - Key files explanation
   - Architecture overview

6. Development:
   - Setup instructions
   - Testing procedures
   - Contribution guidelines
   - Code style guide

7. Deployment:
   - Build process
   - Environment setup
   - Deployment steps

8. Additional Information:
   - License
   - Authors/Team
   - Acknowledgments
   - Changelog
   - Support/Contact`;

      const userPrompt = `Please generate an enhanced README.md for the following repository:

Repository Information:
Name: ${repository.name}
Description: ${repository.description || "No description provided"}
Language: ${repository.language || "Not specified"}
Topics: ${repository.topics?.join(", ") || "None"}

Existing README Content:
${existingReadme || "No existing README"}

File Structure:
${files.map((file) => `- ${file.path}`).join("\n")}

Requirements:
1. Maintain any valuable information from the existing README
2. Enhance the structure and organization
3. Add missing sections based on the file structure
4. Include relevant badges and links
5. Add code examples where appropriate
6. Ensure proper Markdown formatting
7. Focus on developer-friendly documentation

Please generate a comprehensive README.md that makes the repository more accessible and professional.`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-distill-llama-70b:free",
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

      // Clean up the markdown content
      const cleanedContent = readmeContent
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\n\s*\n/g, "\n\n")
        .replace(/(\n#{1,})/g, "\n\n$1")
        .replace(/(\n<div)/g, "\n\n<div")
        .replace(/(<\/div>)\n/g, "$1\n\n")
        .replace(/!\[([^\]]+)\]\(([^)]+)\)(?!\n\n)/g, "![$1]($2)\n\n")
        .trim();

      return cleanedContent;
    } catch (error) {
      console.error("Error generating repository README:", error);
      throw new Error(`Failed to generate repository README: ${error.message}`);
    }
  }
}
