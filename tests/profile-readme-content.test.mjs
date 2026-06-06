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
