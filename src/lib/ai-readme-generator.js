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
      const systemPrompt = `You are an expert GitHub README designer specializing in creating visually stunning profile READMEs.
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

      const userPrompt = `Create a professionally formatted GitHub profile README using the following data:

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

Requirements:
1. Start with a centered header section:
   \`\`\`html
   <div align="center">
   
   # Your Name
   Your Title/Role
   
   [![Profile Views](https://komarev.com/ghpvc/?username=USERNAME&color=blueviolet)](https://github.com/USERNAME)
   
   </div>
   \`\`\`

2. Add a visually appealing about section with proper spacing:
   \`\`\`markdown
   ## About Me
   
   Brief introduction here...
   
   - Point 1
   - Point 2
   - Point 3
   \`\`\`

3. Create a skills section with properly spaced badges:
   \`\`\`markdown
   ## Skills
   
   ![Skill1](badge-url) ![Skill2](badge-url)
   \`\`\`

4. Add GitHub stats with proper alignment:
   \`\`\`html
   <div align="center">
   
   ![Stats](https://github-readme-stats.vercel.app/api?username=USERNAME)
   
   ![Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=USERNAME)
   
   </div>
   \`\`\`

5. Format the projects section with cards:
   \`\`\`markdown
   ## Projects
   
   <div align="center">
   
   [![Project1](card-url)](project-link)
   
   </div>
   \`\`\`

6. Add activity graph with proper spacing:
   \`\`\`markdown
   ## Activity
   
   ![Activity](graph-url)
   \`\`\`

7. End with a properly formatted connect section:
   \`\`\`markdown
   ## Connect With Me
   
   [![Twitter](badge-url)](link) [![LinkedIn](badge-url)](link)
   \`\`\`

Ensure all sections have proper spacing and markdown formatting.`;

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
}
