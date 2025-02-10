"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RepositorySelector } from "@/components/repository-selector";
import { Eye, Code, Copy, Download, CheckCircle2, Github } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function RepositoryReadmeGenerator() {
  const { data: session } = useSession();
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

    try {
      const response = await fetch(
        `/api/github/repositories/${session.user.username}/${selectedRepo.name}/update-readme`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) throw new Error("Failed to update README");

      toast({
        title: "Success!",
        description: "README has been updated on GitHub",
      });
    } catch (error) {
      console.error("Error updating README:", error);
      toast({
        title: "Error",
        description: "Failed to update README on GitHub",
        variant: "destructive",
      });
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
                href={selectedRepo.html_url}
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
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {isCopied ? (
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={handleSaveToGitHub}>Save to GitHub</Button>
            </div>
          </div>

          <Card className="min-h-[500px] w-full overflow-hidden rounded-lg border bg-card">
            {isPreview ? (
              <div className="prose prose-sm max-w-none p-4 dark:prose-invert">
                <div
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/"/g, "&quot;")
                      .replace(/'/g, "&#039;")
                      .replace(/\n/g, "<br />")
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>")
                      .replace(
                        /\[([^\]]+)\]\(([^)]+)\)/g,
                        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                      )
                      .replace(/#{3} (.*)/g, "<h3>$1</h3>")
                      .replace(/#{2} (.*)/g, "<h2>$1</h2>")
                      .replace(/# (.*)/g, "<h1>$1</h1>")
                      .replace(/- (.*)/g, "• $1"),
                  }}
                />
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
            We'll analyze your repository and generate an enhanced README.md
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
