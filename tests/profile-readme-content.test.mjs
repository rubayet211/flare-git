import assert from "node:assert/strict";
import test from "node:test";

import { normalizeProfileReadme } from "../src/lib/profile-readme-content.mjs";

test("removes an outer markdown response fence", () => {
  const content = "```markdown\n# Hello\n\nWelcome\n```";

  assert.equal(normalizeProfileReadme(content), "# Hello\n\nWelcome");
});

test("removes an unterminated outer markdown response fence", () => {
  const content = "```markdown\n# Hello\n\nWelcome";

  assert.equal(normalizeProfileReadme(content), "# Hello\n\nWelcome");
});

test("preserves internal code fences", () => {
  const content = "# Setup\n\n```bash\nnpm install\n```";

  assert.equal(normalizeProfileReadme(content), content);
});

test("removes unreliable GitHub stats card widgets", () => {
  const content = `
# About

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=octocat&show_icons=true" alt="GitHub Stats" />
  ![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=octocat&layout=compact)
</p>

Still here.
`;

  const normalized = normalizeProfileReadme(content);

  assert.doesNotMatch(normalized, /github-readme-stats/);
  assert.doesNotMatch(normalized, /GitHub Stats|Top Languages/);
  assert.match(normalized, /Still here\./);
});
