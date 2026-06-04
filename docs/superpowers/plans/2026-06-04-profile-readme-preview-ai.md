# Profile README Preview and AI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Profile README previews consistent across the dashboard and refine the current README with style-aware AI instead of replacing it blindly.

**Architecture:** Extract deterministic profile README prompt construction into a focused module that can be tested without API calls. Add one shared Markdown preview component and use it from the editor, Theme Settings, and public profile. Keep generation unsaved until the existing explicit save action.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, react-markdown, remark-gfm, rehype-raw, Node test runner.

---

## File Structure

- Create `src/lib/profile-readme-prompt.mjs`: deterministic prompt and style-preset construction.
- Create `tests/profile-readme-prompt.test.mjs`: prompt contract regression tests.
- Modify `src/lib/ai-readme-generator.js`: use the new prompt helper for profile README generation while preserving the existing model upgrade.
- Modify `src/app/api/github/generate-readme/route.js`: accept current README, enrich verified profile data, and stop persisting generated drafts.
- Create `src/components/profile-readme-preview.jsx`: shared GitHub-style Markdown renderer.
- Modify `src/components/readme-editor.jsx`: style controls, current README generation context, shared preview, actionable errors, unsaved draft behavior.
- Modify `src/components/theme-preview.jsx`: render the saved Profile README in the selected theme.
- Modify `src/app/user/[username]/page.js`: reuse the shared preview for public Profile READMEs.

### Task 1: Add Tested Profile README Prompt Contract

**Files:**
- Create: `tests/profile-readme-prompt.test.mjs`
- Create: `src/lib/profile-readme-prompt.mjs`

- [ ] **Step 1: Write failing tests**

Add Node tests that call `buildProfileReadmePrompts(profileData, preferences, existingReadme)` and assert:

```js
assert.match(userPrompt, /My hand-written introduction/);
assert.match(systemPrompt, /Never invent/i);
assert.match(userPrompt, /Professional/);
assert.match(userPrompt, /Featured FlareGit/);
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `node --test tests/profile-readme-prompt.test.mjs`

Expected: FAIL because `src/lib/profile-readme-prompt.mjs` does not exist.

- [ ] **Step 3: Implement the prompt helper**

Export:

```js
export const PROFILE_README_STYLES = { professional, bold, minimal };
export function buildProfileReadmePrompts(profileData, preferences, existingReadme) {
  return { systemPrompt, userPrompt };
}
```

The helper must normalize unsupported styles to `professional`, include verified profile/GitHub facts and featured projects, include the current README in a fenced source-material section, and explicitly prohibit invented facts.

- [ ] **Step 4: Run the prompt tests**

Run: `node --test tests/profile-readme-prompt.test.mjs`

Expected: PASS.

### Task 2: Wire Refinement Contract Through AI and Route

**Files:**
- Modify: `src/lib/ai-readme-generator.js`
- Modify: `src/app/api/github/generate-readme/route.js`

- [ ] **Step 1: Update generator integration**

Import `buildProfileReadmePrompts` and replace only the profile `generateReadme` prompt-building block:

```js
const { systemPrompt, userPrompt } = buildProfileReadmePrompts(
  profileData,
  preferences,
  existingReadme
);
```

Extend the method signature to:

```js
async generateReadme(profileData, preferences = {}, existingReadme = "")
```

Preserve the existing `google/gemini-3-flash-preview` model changes.

- [ ] **Step 2: Update the route contract**

Read `{ preferences = {}, existingReadme = "" }`, add verified fields to `combinedProfileData`, and call:

```js
const readme = await generator.generateReadme(
  combinedProfileData,
  preferences,
  existingReadme
);
```

Remove the route's `prisma.profile.update` call so generated content remains an unsaved draft.

- [ ] **Step 3: Run focused tests and lint**

Run:

```powershell
node --test tests/profile-readme-prompt.test.mjs
npx eslint src/lib/profile-readme-prompt.mjs src/lib/ai-readme-generator.js src/app/api/github/generate-readme/route.js
```

Expected: tests pass and ESLint has no errors.

### Task 3: Add Shared Profile README Preview

**Files:**
- Create: `src/components/profile-readme-preview.jsx`
- Modify: `src/components/readme-editor.jsx`

- [ ] **Step 1: Create shared renderer**

Build `ProfileReadmePreview({ content, theme, emptyMessage, className })` using:

```jsx
<ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
  {content}
</ReactMarkdown>
```

Apply GitHub-like typography, responsive image/table handling, link styling, code styling, and optional theme CSS variables. Render a meaningful empty state when content is blank.

- [ ] **Step 2: Upgrade editor controls**

Replace direct `ReactMarkdown` usage with `ProfileReadmePreview`. Add accessible Professional/Bold/Minimal style buttons with Professional selected by default.

- [ ] **Step 3: Send current content and show draft state**

Send:

```js
body: JSON.stringify({
  existingReadme: content,
  preferences: { style: generationStyle },
})
```

After success, update content, switch to Preview mode, and show a toast explaining that the result is an unsaved draft. Parse and show server error messages without changing current content on failure.

- [ ] **Step 4: Run targeted lint**

Run:

```powershell
npx eslint src/components/profile-readme-preview.jsx src/components/readme-editor.jsx
```

Expected: no ESLint errors.

### Task 4: Reuse README Preview in Theme Settings and Public Profile

**Files:**
- Modify: `src/components/theme-preview.jsx`
- Modify: `src/app/user/[username]/page.js`

- [ ] **Step 1: Replace Theme Settings mock stats**

Keep a compact identity header, then render:

```jsx
<ProfileReadmePreview
  content={profile?.generatedReadme}
  theme={theme}
  emptyMessage="Generate and save a Profile README to preview it here."
/>
```

Remove static repository/contribution/project counts.

- [ ] **Step 2: Replace public profile README renderer**

Use the shared renderer for `profile.generatedReadme` so the public profile and dashboard previews support the same Markdown and HTML.

- [ ] **Step 3: Run targeted lint**

Run:

```powershell
npx eslint src/components/theme-preview.jsx src/app/user/[username]/page.js
```

Expected: no ESLint errors.

### Task 5: Full Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run tests**

Run:

```powershell
node --test tests/github-account.test.mjs tests/profile-readme-prompt.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run targeted lint and Prisma validation**

Run:

```powershell
npx eslint src/lib/profile-readme-prompt.mjs src/lib/ai-readme-generator.js src/app/api/github/generate-readme/route.js src/components/profile-readme-preview.jsx src/components/readme-editor.jsx src/components/theme-preview.jsx src/app/user/[username]/page.js
npx prisma validate
```

Expected: no ESLint errors; Prisma schema is valid.

- [ ] **Step 3: Build production app**

Run: `npm run build`

Expected: build exits `0`.

- [ ] **Step 4: Browser verification**

Run the dev server and verify:

- Profile README editor shows all three style controls.
- Preview renders raw alignment HTML, GFM tables, badges, and images.
- Theme Settings preview renders the saved Profile README with selected colors.
- Public profile uses the same renderer.
- Generation failures preserve existing editor content and display server errors.

## Plan Self-Review

- Spec coverage: shared preview, themed preview, style presets, existing README
  refinement, explicit save, error preservation, and verification are covered.
- Placeholder scan: no TBD/TODO/implicit implementation steps remain.
- Type consistency: the route, editor, generator, and helper all use
  `existingReadme` and `preferences.style`.
