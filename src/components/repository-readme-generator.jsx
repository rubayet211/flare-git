"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RepositorySelector } from "@/components/repository-selector";
import { Eye, Code, Copy, Download, CheckCircle2, Github, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { getGitHubRepositoryUrl } from "@/lib/github-url.mjs";

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl font-bold mb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl font-bold mb-3" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg font-bold mb-2" {...props} />
  ),
  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-6 mb-4" {...props} />
  ),
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    if (inline) {
      return (
        <code className="rounded bg-muted px-1 py-0.5" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 mb-4">
        <code className={language ? `language-${language}` : ""} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  img: ({ node, ...props }) => (
    <img
      className="max-w-full rounded-lg my-4"
      {...props}
      alt={props.alt || ""}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table
        className="w-full border-collapse border border-border"
        {...props}
      />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border border-border bg-muted p-2 text-left" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-border p-2" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic my-4"
      {...props}
    />
  ),
  hr: ({ node, ...props }) => <hr className="border-border my-4" {...props} />,
};

export function RepositoryReadmeGenerator() {
  const { data: session } = useSession();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingToGitHub, setIsSavingToGitHub] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleRepoSelect = async (repo) => {
    setSelectedRepo(repo);
    setIsRepoSelectorOpen(false);
    setIsGenerating(true);

    try {
      // Fetch repository data and existing README
      const response = await fetch(
        `/api/github/repositories/${session.user.username}/${repo.name}/readme`
      );
      const data = await response.json();

      // Generate enhanced README using AI
      const aiResponse = await fetch("/api/ai/generate-repo-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: repo,
          existingReadme: data.content,
          files: data.files,
        }),
      });

      if (!aiResponse.ok) throw new Error("Failed to generate README");
      const { readme } = await aiResponse.json();
      setContent(readme);
    } catch (error) {
      console.error("Error generating README:", error);
      toast({
        title: "Error",
        description: "Failed to generate README. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "README content copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToGitHub = async () => {
    if (!selectedRepo) return;

    setIsSavingToGitHub(true);
    try {
      const response = await fetch(
        `/api/github/repositories/${session.user.username}/${selectedRepo.name}/update-readme`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update README");
      }

      toast({
        title: "Success!",
        description: "README has been updated on GitHub",
      });
    } catch (error) {
      console.error("Error updating README:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update README on GitHub",
        variant: "destructive",
      });
    } finally {
      setIsSavingToGitHub(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Repository README Generator</h2>
        <Button onClick={() => setIsRepoSelectorOpen(true)}>
          {selectedRepo ? "Change Repository" : "Select Repository"}
        </Button>
      </div>

      {selectedRepo && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{selectedRepo.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedRepo.description}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href={getGitHubRepositoryUrl(
                  selectedRepo,
                  session?.user?.username
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </Card>
      )}

      {isGenerating ? (
        <Card className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p>Generating enhanced README...</p>
          </div>
        </Card>
      ) : content ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isPreview ? "outline" : "default"}
                size="sm"
                onClick={() => setIsPreview(false)}
              >
                <Code className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant={isPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPreview(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isSavingToGitHub}
              >
                {isCopied ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isSavingToGitHub}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={handleSaveToGitHub}
                disabled={isSavingToGitHub}
              >
                {isSavingToGitHub && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSavingToGitHub ? "Saving..." : "Save to GitHub"}
              </Button>
            </div>
          </div>

          <Card className="min-h-[500px] w-full overflow-hidden rounded-lg border bg-card">
            {isPreview ? (
              <div className="prose prose-sm max-w-none overflow-y-auto p-4 dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={MarkdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[500px] w-full resize-none bg-transparent p-4 font-mono text-sm focus:outline-none"
                spellCheck="false"
              />
            )}
          </Card>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Github className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            Select a repository to get started
          </h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll analyze your repository and generate an enhanced README.md
            file
          </p>
        </Card>
      )}

      <RepositorySelector
        open={isRepoSelectorOpen}
        onOpenChange={setIsRepoSelectorOpen}
        onSelect={handleRepoSelect}
      />
    </div>
  );
}
