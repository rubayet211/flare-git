import { buildProfileReadmePrompts } from "./profile-readme-prompt.mjs";
import { normalizeProfileReadme } from "./profile-readme-content.mjs";

export class AIReadmeGenerator {
  constructor(apiEndpoint, apiKey) {
    if (!apiEndpoint || !apiKey) {
      throw new Error("AI API endpoint and key are required");
    }
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async generateReadme(profileData, preferences = {}, existingReadme = "") {
    try {
      const { systemPrompt, userPrompt } = buildProfileReadmePrompts(
        profileData,
        preferences,
        existingReadme
      );

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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
      const cleanedContent = normalizeProfileReadme(readmeContent)
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
          model: "google/gemini-3-flash-preview",
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
- Use standard markdown. Avoid overly complex HTML.
- Create visually distinct sections with clear separation
- Use modern documentation patterns like collapsible sections and tabs
- NEVER hallucinate features that are not in the repository details or file list.`;

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
   - Large project name
   - Badges row (build, version, license, stars, etc.)
   - Brief, impactful project description

2. Key Features
   - Bulleted list of main features based ONLY on what you can infer from the file list and description

3. Quick Start (Developer-Friendly)
   - Guessed installation command in a code block based on language (e.g. npm install if package.json exists, pip install if requirements.txt exists)
   - Basic usage example

4. Documentation (Well-Structured)
   - File structure summary

5. License
   - License section if license file is detected

Styling Requirements:
1. Keep it clean and professional. 
2. Use markdown headings (#, ##, ###) for structure.
3. Use markdown code blocks for code snippets.
4. Use standard markdown tables if tabular data is needed.
5. Do not use overly complex nested HTML.

Remember to:
- Use markdown headings correctly
- Include plenty of whitespace for readability
- DO NOT invent commands, features, or APIs that you cannot confirm exist based on the file list.`;

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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
