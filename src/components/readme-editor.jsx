"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, Code, Copy, Download, CheckCircle2, Github, Loader2, Sparkles, Save } from "lucide-react";
import { ProfileReadmePreview } from "@/components/profile-readme-preview";
import { buildGitHubProfileUrl } from "@/lib/github-url.mjs";

const GENERATION_STYLES = [
  {
    id: "professional",
    label: "Professional",
    description: "Polished and recruiter-friendly",
  },
  {
    id: "bold",
    label: "Bold",
    description: "Expressive, visual, and energetic",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Concise, focused, and clean",
  },
];

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

export function ReadmeEditor({ profile, onSaved }) {
  const { data: session } = useSession();
  const [content, setContent] = useState(DEFAULT_README);
  const [isPreview, setIsPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStyle, setGenerationStyle] = useState("professional");
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.generatedReadme) {
      setContent(profile.generatedReadme);
      setHasUnsavedDraft(false);
    } else if (profile?.githubUsername) {
      setContent(
        DEFAULT_README
          .replace(/\[@username\]/g, `[@${profile.githubUsername}]`)
          .replace(/username=/g, `username=${profile.githubUsername}`)
      );
      setHasUnsavedDraft(false);
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
    const profileUrl = buildGitHubProfileUrl(profile?.githubUsername);
    if (profileUrl) {
      window.open(profileUrl, "_blank");
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

      const updatedProfile = await response.json();
      onSaved?.(updatedProfile);
      toast({
        title: "Saved!",
        description: "Profile README saved to database",
      });
      setHasUnsavedDraft(false);
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

  const handlePublishToGitHub = async () => {
    if (!content.trim()) {
      toast({
        title: "README is empty",
        description: "Add README content before setting it on GitHub.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch("/api/github/profile-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.error || "Failed to publish Profile README to GitHub"
        );
      }

      toast({
        title: "Published to GitHub",
        description:
          "Your GitHub profile README has been created or updated.",
      });
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error publishing Profile README:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to publish Profile README to GitHub",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
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
          existingReadme: content,
          preferences: { style: generationStyle },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to improve Profile README"
        );
      }

      const data = await response.json();
      setContent(data.readme);
      setIsPreview(true);
      setHasUnsavedDraft(true);
      toast({
        title: "Draft improved",
        description:
          "Review the AI-refined README, then save it when you are ready.",
      });
    } catch (error) {
      console.error("Error generating README:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to improve Profile README",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">AI refinement style</h2>
            <p className="text-sm text-muted-foreground">
              AI improves your current README and keeps verified profile details
              accurate.
            </p>
          </div>
          <div
            className="grid gap-2 sm:grid-cols-3"
            role="group"
            aria-label="Profile README generation style"
          >
            {GENERATION_STYLES.map((style) => (
              <Button
                key={style.id}
                type="button"
                variant={generationStyle === style.id ? "default" : "outline"}
                className="h-auto justify-start whitespace-normal px-3 py-2 text-left"
                onClick={() => setGenerationStyle(style.id)}
                disabled={isGenerating}
                aria-pressed={generationStyle === style.id}
              >
                <span>
                  <span className="block text-xs font-semibold">
                    {style.label}
                  </span>
                  <span className="block text-[11px] font-normal opacity-75">
                    {style.description}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

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
            disabled={isGenerating || isSaving || isPublishing}
            className="border-purple-500 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? "Improving..." : "Improve with AI"}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isGenerating || isSaving || isPublishing}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save to FlareGit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublishToGitHub}
            disabled={isGenerating || isSaving || isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            {isPublishing ? "Publishing..." : "Set on GitHub"}
          </Button>
          {hasUnsavedDraft && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isGenerating || isPublishing}
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
            disabled={isGenerating || isPublishing}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewOnGitHub}
            disabled={isGenerating || isPublishing}
          >
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
            <ProfileReadmePreview content={content} className="min-h-[500px] p-6" />
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasUnsavedDraft(true);
              }}
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
          <li>Use Improve with AI to refine your current content without discarding your voice.</li>
          <li>Click Save to FlareGit to update the about section of your public FlareGit profile.</li>
          <li>Click Set on GitHub to publish this content to your GitHub profile README repository.</li>
          <li>Include key skills, links, badges, and project callouts.</li>
          <li>Make manual adjustments in the editor to make it truly personal before copying it to your GitHub profile repo.</li>
        </ul>
      </div>
    </div>
  );
}
