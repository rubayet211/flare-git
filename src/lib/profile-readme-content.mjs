const GITHUB_README_STATS_URL =
  /https?:\/\/github-readme-stats(?:-[^\s/"'<>)]*)?\.vercel\.app\/api(?:\/top-langs\/?|\/)?[^\s"'<>)]*/gi;

export function normalizeProfileReadme(content) {
  if (typeof content !== "string") return "";

  const trimmed = content.trim();
  const outerFence = trimmed.match(
    /^```(?:markdown|md)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/i
  );

  if (outerFence) return removeUnreliableGitHubStatsWidgets(outerFence[1].trim());

  return removeUnreliableGitHubStatsWidgets(
    trimmed.replace(/^```(?:markdown|md)[ \t]*\r?\n/i, "").trim()
  );
}

export function removeUnreliableGitHubStatsWidgets(content) {
  if (typeof content !== "string") return "";

  const githubStatsUrlSource = GITHUB_README_STATS_URL.source;
  const linkedMarkdownImage = new RegExp(
    String.raw`\[\s*!\[[^\]]*]\(\s*${githubStatsUrlSource}\s*\)\s*]\([^)]+\)`,
    "gi"
  );
  const markdownImage = new RegExp(
    String.raw`!\[[^\]]*]\(\s*${githubStatsUrlSource}\s*\)`,
    "gi"
  );
  const htmlImage = new RegExp(
    String.raw`<img\b[^>]*\bsrc=["']\s*${githubStatsUrlSource}\s*["'][^>]*>`,
    "gi"
  );

  return content
    .replace(linkedMarkdownImage, "")
    .replace(markdownImage, "")
    .replace(htmlImage, "")
    .replace(/<(p|div)(?:\s+[^>]*)?>\s*<\/\1>/gi, "")
    .replace(/[ \t]+\r?\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
