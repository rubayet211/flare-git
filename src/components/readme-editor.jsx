"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Code, Copy, Download, CheckCircle2, Github, Loader2, Sparkles, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DEFAULT_README = `# Hi there 👋

## About Me
I'm a passionate developer who loves to code and build things.

### 🔭 Current Work
- Working on exciting projects
- Learning new technologies

### 🌱 Skills
- Programming Languages: JavaScript, Python, Java
- Frontend: React, Next.js, HTML/CSS
- Backend: Node.js, Express
- Database: MongoDB, PostgreSQL

### 📫 How to reach me
- Website: [portfolio.com](https://portfolio.com)
`;

export function ReadmeEditor({ profile }) {
  const { data: session } = useSession();
  const [content, setContent] = useState(DEFAULT_README);
  const [isPreview, setIsPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.generatedReadme) {
      setContent(profile.generatedReadme);
    } else if (profile?.githubUsername) {
      setContent(
        DEFAULT_README
          .replace(/\[@username\]/g, `[@${profile.githubUsername}]`)
          .replace(/username=/g, `username=${profile.githubUsername}`)
      );
    }
  }, [profile]);

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

  const handleViewOnGitHub = () => {
    if (profile?.githubUsername) {
      window.open(
        `https://github.com/${profile.githubUsername}/${profile.githubUsername}`,
        "_blank"
      );
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/profile/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customUrl: profile?.customUrl || "",
          location: profile?.location || "",
          website: profile?.website || "",
          twitter: profile?.twitter || "",
          linkedin: profile?.linkedin || "",
          specialization: profile?.specialization || "",
          aiGeneratedBio: profile?.aiGeneratedBio || "",
          customTheme: profile?.customTheme || null,
          featuredProjects: profile?.featuredProjects || [],
          generatedReadme: content, // Save edited README
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save README");
      }

      toast({
        title: "Saved!",
        description: "Profile README saved to database",
      });
    } catch (error) {
      console.error("Error saving profile README:", error);
      toast({
        title: "Error",
        description: "Failed to save README",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/github/generate-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: {
            style: "modern",
            layout: "professional",
            sections: [
              "header",
              "about",
              "skills",
              "statistics",
              "projects",
              "contributions",
              "contact",
            ],
            theme: "radical",
            features: {
              animations: true,
              dynamicStats: true,
              skillBadges: true,
              profileViews: true,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate README");
      }

      const data = await response.json();
      setContent(data.readme);
      toast({
        title: "Generated!",
        description: "AI successfully generated your profile README",
      });
    } catch (error) {
      console.error("Error generating README:", error);
      toast({
        title: "Error",
        description: "Failed to generate README with AI",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPreview(false)}
            disabled={isGenerating}
          >
            <Code className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(true)}
            disabled={isGenerating}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || isSaving}
            className="border-purple-500 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Generate with AI"}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isGenerating || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save README
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={isGenerating}>
            {isCopied ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewOnGitHub} disabled={isGenerating}>
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </Button>
        </div>
      </div>

      {isGenerating ? (
        <Card className="relative flex min-h-[500px] w-full flex-col items-center justify-center border bg-card p-6">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-500" />
          <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 animate-pulse">Generating your Profile README...</h3>
          <p className="max-w-md text-center text-sm text-muted-foreground mt-2">
            Gemini is analyzing your GitHub activity, languages, featured projects, and specializations to compile a beautiful profile dashboard.
          </p>
        </Card>
      ) : (
        <Card className="relative min-h-[500px] w-full overflow-hidden border bg-card">
          {isPreview ? (
            <div className="prose prose-sm max-w-none p-6 dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] w-full resize-none bg-transparent p-6 font-mono text-sm focus:outline-none"
              spellCheck="false"
            />
          )}
        </Card>
      )}

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-2 font-semibold">
          Tips for a great GitHub Profile README:
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Use the **Generate with AI** button to bootstrap a stats-rich portfolio dashboard.</li>
          <li>Click **Save README** to update the about section of your public FlareGit profile.</li>
          <li>Include key skills, links, badges, and project callouts.</li>
          <li>Make manual adjustments in the editor to make it truly personal before copying it to your GitHub profile repo.</li>
        </ul>
      </div>
    </div>
  );
}
