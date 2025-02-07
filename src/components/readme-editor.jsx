"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Code, Copy, Download, CheckCircle2, Github } from "lucide-react";

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
- GitHub: [@username](https://github.com/username)
- Website: [portfolio.com](https://portfolio.com)

### 📊 GitHub Stats
![GitHub Stats](https://github-readme-stats.vercel.app/api?username=username&show_icons=true&theme=radical)

### 🏆 GitHub Trophies
![GitHub Trophies](https://github-profile-trophy.vercel.app/?username=username&theme=radical)

### 📈 Contribution Graph
![GitHub Contribution Graph](https://activity-graph.herokuapp.com/graph?username=username&theme=react-dark)
`;

export function ReadmeEditor({ profile }) {
  const [content, setContent] = useState(DEFAULT_README);
  const [isPreview, setIsPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.githubUsername) {
      setContent(
        content
          .replace(/\[@username\]/g, `[@${profile.githubUsername}]`)
          .replace(/username=/g, `username=${profile.githubUsername}`)
      );
    }
  }, [profile?.githubUsername]);

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

  return (
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
          <Button variant="outline" size="sm" onClick={handleViewOnGitHub}>
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </Button>
        </div>
      </div>

      <Card className="relative min-h-[500px] w-full overflow-hidden rounded-lg border bg-card">
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

      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-2 font-semibold">
          Tips for a great GitHub Profile README:
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Add a brief introduction about yourself</li>
          <li>Highlight your key skills and technologies</li>
          <li>Showcase your current projects or work</li>
          <li>Include ways to contact you</li>
          <li>Add GitHub statistics to show your activity</li>
          <li>Use emojis to make it more engaging</li>
          <li>Keep it concise and well-organized</li>
        </ul>
      </div>
    </div>
  );
}
