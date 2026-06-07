# Profile README Preview and AI Refinement Design

## Goal

Make the Profile README the primary representation of a user's portfolio by
rendering it consistently in the editor and Theme Settings preview, and by
having AI improve the user's current README instead of replacing it blindly.

## Scope

This feature updates:

- The Profile README editor and preview experience.
- The Theme Settings preview.
- The Profile README AI-generation request and prompt.
- Error handling and unsaved-generation behavior.

This feature does not:

- Automatically publish changes to GitHub.
- Add new database fields.
- Change repository README generation.
- Invent achievements, projects, technologies, or links.

## User Experience

### Shared README Preview

A reusable `ProfileReadmePreview` component renders GitHub-flavored Markdown
with consistent styling. It supports headings, lists, tables, task lists,
code blocks, links, images, badges, blockquotes, horizontal rules, and the
limited raw HTML commonly used in GitHub Profile READMEs for alignment and
collapsible sections.

The component is used in two places:

1. The Profile README editor's Preview mode renders the current editor content.
2. Theme Settings renders the saved Profile README inside a themed portfolio
   frame using the selected background, card, text, heading, and primary
   colors.

If no saved Profile README exists, Theme Settings renders a useful empty state
that directs the user to generate or edit one.

### AI Refinement

The Profile README editor offers three generation styles:

- `Professional` is the default and balances polish with restraint.
- `Bold` emphasizes visual sections, badges, and expressive presentation.
- `Minimal` prioritizes concise writing and reduced visual noise.

When the user selects Generate with AI, the editor sends:

- The current editor content as `existingReadme`.
- The selected style preset.
- The existing profile and GitHub data already collected by the server.

The generated result replaces the editor content locally and switches to
Preview mode. It remains unsaved until the user explicitly clicks Save README.
The server must not save generated content during the generation request.

The AI prompt instructs the model to preserve valuable personal content,
improve structure and writing, enrich the README with verified profile data,
featured projects, GitHub statistics, and valid widgets, and never invent
unsupported facts.

### Errors

The UI displays the server-provided error message when generation fails.
Authentication failures remain actionable and instruct the user to reconnect
GitHub. Existing README content remains unchanged after a failed request.

## Architecture

### Preview Component

Create `src/components/profile-readme-preview.jsx`.

Responsibilities:

- Render a supplied Markdown string.
- Apply consistent GitHub-like typography and spacing.
- Safely support the HTML already expected in generated Profile READMEs through
  `rehype-raw`.
- Accept an optional theme used by Theme Settings.
- Render an empty state when content is missing.

`ReadmeEditor` owns editing, generation, saving, copying, and downloading.
`ThemePreview` owns the themed portfolio frame and delegates README rendering
to `ProfileReadmePreview`.

### Generation Contract

The POST body for `/api/github/generate-readme` becomes:

```json
{
  "existingReadme": "current editor Markdown",
  "preferences": {
    "style": "professional"
  }
}
```

The route collects the same verified GitHub and FlareGit profile data, adds the
GitHub username, specialization, AI-generated bio, and featured projects, then
passes `existingReadme` and preferences to `AIReadmeGenerator.generateReadme`.

The route returns the generated README but does not persist it. Persistence
continues through the existing explicit Save README action.

### Prompt Construction

Extract deterministic prompt-building helpers from the generator so the
generation contract can be regression-tested without making AI API calls.

The prompt must:

- Treat the current README as source material to improve.
- Preserve personal sections and links unless they conflict with verified data.
- Use only supplied profile and GitHub facts.
- Prefer durable GitHub-compatible Markdown and commonly supported HTML.
- Respect the selected style preset.
- Avoid excessive widgets, duplicate statistics, broken badge URLs, and
  fabricated claims.

## Testing

Add focused Node tests for prompt construction:

- Existing README content is included as source material.
- The selected style changes the prompt guidance.
- Verified profile fields and featured projects are included.
- The prompt explicitly forbids invented facts.

Verify the UI and integration through:

- Targeted ESLint on touched files.
- Production Next.js build.
- Local browser checks for editor Preview mode, Theme Settings preview, style
  controls, loading state, and generation error handling.

## Success Criteria

- Both preview locations use the same README renderer.
- Theme Settings visibly reflects the selected theme around the Profile README.
- AI generation uses the current editor content and selected style.
- Generated output is not persisted until Save README is clicked.
- Failed generation does not destroy current editor content.
- The project builds successfully and focused tests pass.
