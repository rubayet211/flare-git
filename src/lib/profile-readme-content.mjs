export function normalizeProfileReadme(content) {
  if (typeof content !== "string") return "";

  const trimmed = content.trim();
  const outerFence = trimmed.match(
    /^```(?:markdown|md)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/i
  );

  if (outerFence) return outerFence[1].trim();

  return trimmed.replace(/^```(?:markdown|md)[ \t]*\r?\n/i, "").trim();
}
