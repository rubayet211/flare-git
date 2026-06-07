import { FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import { normalizeProfileReadme } from "@/lib/profile-readme-content.mjs";

const blockedComponents = {
  script: () => null,
  style: () => null,
  iframe: () => null,
  object: () => null,
  embed: () => null,
  form: () => null,
};

export function ProfileReadmePreview({
  content,
  theme,
  emptyMessage = "Your Profile README preview will appear here.",
  className,
}) {
  const normalizedContent = normalizeProfileReadme(content);
  const previewStyle = theme
    ? {
        "--readme-background": theme.card,
        "--readme-text": theme.text,
        "--readme-heading": theme.heading,
        "--readme-link": theme.primary,
        "--readme-border": `${theme.text}24`,
        "--readme-muted": `${theme.text}12`,
      }
    : undefined;

  if (!normalizedContent) {
    return (
      <div
        className={cn(
          "flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
          className
        )}
        style={previewStyle}
      >
        <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "profile-readme-preview min-w-0 overflow-hidden rounded-lg",
        className
      )}
      style={previewStyle}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}
        components={{
          ...blockedComponents,
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ alt, ...props }) => (
            // Markdown previews intentionally render remote GitHub badges and widgets.
            // eslint-disable-next-line @next/next/no-img-element
            <img {...props} alt={alt || ""} loading="lazy" />
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      <style jsx global>{`
        .profile-readme-preview {
          background: var(--readme-background, transparent);
          color: var(--readme-text, inherit);
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
            sans-serif;
          font-size: 16px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .profile-readme-preview > :first-child {
          margin-top: 0 !important;
        }

        .profile-readme-preview > :last-child {
          margin-bottom: 0 !important;
        }

        .profile-readme-preview h1,
        .profile-readme-preview h2,
        .profile-readme-preview h3,
        .profile-readme-preview h4 {
          color: var(--readme-heading, inherit);
          font-weight: 650;
          line-height: 1.25;
          margin-bottom: 0.75rem;
          margin-top: 1.75rem;
        }

        .profile-readme-preview h1 {
          border-bottom: 1px solid var(--readme-border, hsl(var(--border)));
          font-size: 2rem;
          padding-bottom: 0.4rem;
        }

        .profile-readme-preview h2 {
          border-bottom: 1px solid var(--readme-border, hsl(var(--border)));
          font-size: 1.5rem;
          padding-bottom: 0.35rem;
        }

        .profile-readme-preview h3 {
          font-size: 1.25rem;
        }

        .profile-readme-preview p,
        .profile-readme-preview ul,
        .profile-readme-preview ol,
        .profile-readme-preview blockquote,
        .profile-readme-preview pre,
        .profile-readme-preview table,
        .profile-readme-preview details {
          margin-bottom: 1rem;
        }

        .profile-readme-preview ul,
        .profile-readme-preview ol {
          padding-left: 2rem;
        }

        .profile-readme-preview ul {
          list-style: disc;
        }

        .profile-readme-preview ol {
          list-style: decimal;
        }

        .profile-readme-preview li + li {
          margin-top: 0.3rem;
        }

        .profile-readme-preview a {
          color: var(--readme-link, #0969da);
          font-weight: 500;
          text-decoration: none;
        }

        .profile-readme-preview a:hover {
          text-decoration: underline;
        }

        .profile-readme-preview img {
          display: inline-block;
          height: auto;
          max-width: 100%;
          vertical-align: middle;
        }

        .profile-readme-preview pre {
          background: var(--readme-muted, hsl(var(--muted)));
          border-radius: 0.5rem;
          overflow-x: auto;
          padding: 1rem;
        }

        .profile-readme-preview code {
          background: var(--readme-muted, hsl(var(--muted)));
          border-radius: 0.35rem;
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
          padding: 0.15em 0.35em;
        }

        .profile-readme-preview pre code {
          background: transparent;
          padding: 0;
        }

        .profile-readme-preview blockquote {
          border-left: 0.25rem solid
            var(--readme-border, hsl(var(--border)));
          color: var(--readme-text, inherit);
          opacity: 0.8;
          padding-left: 1rem;
        }

        .profile-readme-preview table {
          border-collapse: collapse;
          display: block;
          max-width: 100%;
          overflow-x: auto;
          width: max-content;
        }

        .profile-readme-preview th,
        .profile-readme-preview td {
          border: 1px solid var(--readme-border, hsl(var(--border)));
          padding: 0.5rem 0.75rem;
        }

        .profile-readme-preview tr:nth-child(2n) {
          background: var(--readme-muted, hsl(var(--muted)));
        }

        .profile-readme-preview hr {
          border: 0;
          border-top: 1px solid var(--readme-border, hsl(var(--border)));
          margin: 1.5rem 0;
        }

        .profile-readme-preview details {
          border: 1px solid var(--readme-border, hsl(var(--border)));
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
        }

        .profile-readme-preview summary {
          cursor: pointer;
          font-weight: 600;
        }

        .profile-readme-preview div[align="center"],
        .profile-readme-preview p[align="center"] {
          text-align: center;
        }

        .profile-readme-preview div[align="right"],
        .profile-readme-preview p[align="right"] {
          text-align: right;
        }
      `}</style>
    </div>
  );
}
