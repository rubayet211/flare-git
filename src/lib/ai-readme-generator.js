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
          model: "google/gemini-2.0-pro-exp-02-05:free",
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
      const systemPrompt = `You are an expert README preview generator specializing in GitHub-flavored markdown.
Your task is to format and enhance README content while maintaining proper markdown syntax.

Key Requirements:
- Use proper markdown syntax for all formatting
- Avoid raw HTML unless absolutely necessary
- Create clear section hierarchy with markdown headers
- Use markdown tables instead of HTML tables
- Properly format code blocks with language specification
- Use markdown syntax for images and badges
- Maintain clean, consistent spacing
- Preserve all links and references

Format Guidelines:
1. Use proper markdown heading levels (# ## ###)
2. Format lists with proper indentation
3. Use markdown tables with aligned columns
4. Create code blocks with language specification
5. Use proper image and link markdown syntax
6. Maintain consistent line spacing
7. Use markdown blockquotes where appropriate`;

      const userPrompt = `Format and enhance the following README content using proper markdown syntax:

${content}

Ensure:
1. All sections use proper markdown headers
2. Code blocks specify their language
3. Tables are properly formatted in markdown
4. Images and badges use markdown syntax
5. Lists are properly indented
6. Links use markdown format
7. Blockquotes use proper markdown syntax
8. Consistent spacing between sections
9. Proper emphasis using markdown (* and **)
10. Clean and readable formatting`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-pro-exp-02-05:free",
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
          errorData.error ||
            `Preview request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      const previewContent = data.choices?.[0]?.message?.content;

      if (!previewContent) {
        throw new Error("No preview content generated");
      }

      // Clean up and standardize the preview content
      const cleanedPreview = previewContent
        .replace(/\n{3,}/g, "\n\n") // Standardize multiple newlines
        .replace(/\n\s*\n/g, "\n\n") // Fix spacing between sections
        .replace(/(\n#{1,})/g, "\n\n$1") // Add proper spacing before headers
        .replace(/(\n<div)/g, "\n\n<div") // Add proper spacing before divs
        .replace(/(<\/div>)\n/g, "$1\n\n") // Add proper spacing after divs
        .replace(/(<\/table>)\n/g, "$1\n\n") // Add proper spacing after tables
        .replace(/(<\/details>)\n/g, "$1\n\n") // Add proper spacing after collapsible sections
        .replace(/!\[([^\]]+)\]\(([^)]+)\)(?!\n\n)/g, "![$1]($2)\n\n") // Fix image spacing
        .replace(/<\/h([1-6])>\n(?!\n)/g, "</h$1>\n\n") // Add proper spacing after headings
        .replace(/<\/p>\n(?!\n)/g, "</p>\n\n") // Add proper spacing after paragraphs
        .replace(/```\n(?!\n)/g, "```\n\n") // Add proper spacing after code blocks
        .trim();

      return cleanedPreview;
    } catch (error) {
      console.error("Error generating README preview:", error);
      throw new Error(`Failed to generate README preview: ${error.message}`);
    }
  }

  async generateRepositoryReadme(repository, existingReadme, files) {
    try {
      const systemPrompt = `You are an expert technical documentation writer and UI/UX specialist creating modern, visually stunning GitHub READMEs.
Your task is to create a README that not only documents the project but also serves as an impressive landing page.

Key Principles:
- Create visually striking headers with centered badges and logos
- Use modern GitHub-style formatting and layout
- Implement creative ASCII/Unicode art where appropriate
- Balance visual appeal with professional documentation
- Ensure mobile-friendly formatting
- Use gradient text effects for key headings (using HTML when needed)
- Create visually distinct sections with clear separation
- Use modern documentation patterns like collapsible sections and tabs`;

      const userPrompt = `Create a stunning, modern README.md that serves as both documentation and a project landing page:

Repository Details:
- Name: ${repository.name}
- Description: ${repository.description || "No description provided"}
- Primary Language: ${repository.language || "Not specified"}
- Topics/Tags: ${repository.topics?.join(", ") || "None"}
- Stars: ${repository.stargazers_count || 0}
- Forks: ${repository.forks_count || 0}

Project Structure:
\`\`\`
${files.map((file) => file.path).join("\n")}
\`\`\`

Previous README (to preserve relevant information):
\`\`\`markdown
${existingReadme || "No existing README"}
\`\`\`

Create a README with this modern structure:

1. Header Section (Visually Striking)
   - Large centered project name with custom font styling
   - Animated badges row (build, version, license, stars, etc.)
   - Brief, impactful project description
   - Quick links with custom icons
   - Visual preview (screenshot/GIF) in a styled container

2. Key Features (Visual Grid)
   - Feature cards with icons
   - Visual demonstrations
   - Code preview snippets in styled containers
   - Feature comparison table if applicable

3. Quick Start (Developer-Friendly)
   - One-line installation command in a styled box
   - Basic usage example in a syntax-highlighted block
   - Common commands in a styled table
   - Environment setup in collapsible sections

4. Documentation (Well-Structured)
   - Clear navigation with jump links
   - API documentation in modern table format
   - Configuration options in collapsible sections
   - Examples with copy-to-clipboard buttons

5. Project Architecture
   - Visual architecture diagram
   - Directory structure in a styled tree
   - Component relationships diagram
   - Tech stack badges in a grid

6. Development Guide
   - Prerequisites checklist
   - Step-by-step setup guide
   - Development workflow diagram
   - Testing instructions in collapsible sections

7. Community & Support
   - Contribution workflow diagram
   - Code of conduct summary
   - Support channels with badges
   - Contributors section with avatars

8. Footer
   - License badge and summary
   - Author information with social links
   - Project status badges
   - "Made with ❤️" section

Styling Requirements:
1. Use HTML for enhanced styling where appropriate:
   \`\`\`html
   <h1 align="center">
     <img src="logo.png" alt="Logo" width="200px"><br>
     Project Name
   </h1>
   <p align="center">
     <a href="#"><img src="badge1.svg" alt="badge1"></a>
     <a href="#"><img src="badge2.svg" alt="badge2"></a>
   </p>
   \`\`\`

2. Create visually distinct sections:
   \`\`\`html
   <div align="center">
   <table>
   <tr>
   <td width="50%">
     <h3 align="center">Feature 1</h3>
     <p align="center">
       <img src="feature1.gif" alt="Feature 1" width="100%">
     </p>
   </td>
   <td width="50%">
     <h3 align="center">Feature 2</h3>
     <p align="center">
       <img src="feature2.gif" alt="Feature 2" width="100%">
     </p>
   </td>
   </tr>
   </table>
   </div>
   \`\`\`

3. Use modern badges and shields:
   - Dynamic GitHub stats badges
   - Custom-styled shields.io badges
   - Technology stack badges
   - Status and version badges

4. Implement collapsible sections:
   \`\`\`html
   <details>
   <summary>📖 Detailed Documentation</summary>
   
   Content here...
   </details>
   \`\`\`

5. Add styled code blocks:
   \`\`\`html
   <pre>
   <code>
   npm install your-package
   </code>
   </pre>
   \`\`\`

6. Create feature highlights:
   \`\`\`html
   <div align="center">
   <table>
   <tr>
   <th>Feature</th>
   <th>Description</th>
   </tr>
   <!-- Add rows here -->
   </table>
   </div>
   \`\`\`

Remember to:
- Use centered layouts for key sections
- Include plenty of whitespace for readability
- Add hover effects using HTML/CSS where possible
- Use consistent emoji sets for section headers
- Create visual hierarchy with different heading sizes
- Include quick-copy code blocks
- Add "Back to Top" links for long sections
- Use tables for structured information
- Include progress bars for version status
- Add keyboard shortcut tables if applicable

Make the README visually impressive while maintaining professional documentation standards.`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-pro-exp-02-05:free",
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
