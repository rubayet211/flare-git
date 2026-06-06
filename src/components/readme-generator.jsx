import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReadmeGenerator() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [readme, setReadme] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState("preview");

  const generateReadme = async () => {
    setLoading(true);
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
              activityGraph: true,
              githubTrophies: true,
              contributionStats: true,
              languageStats: true,
              streakStats: true,
            },
            styling: {
              alignCenter: true,
              useCustomBadges: true,
              addSeparators: true,
              useEmoji: true,
              addBanners: true,
            },
            widgets: {
              githubStats: {
                theme: "radical",
                showIcons: true,
                includeAllCommits: true,
                countPrivate: true,
                borderRadius: 10,
                background: "true",
              },
              languageStats: {
                theme: "radical",
                layout: "compact",
                borderRadius: 10,
                background: "true",
              },
              streakStats: {
                theme: "radical",
                background: "true",
              },
              activityGraph: {
                theme: "redical",
                background: "true",
              },
              trophies: {
                theme: "radical",
                column: 6,
                rank: "SSS,SS,S,AAA,AA,A",
                background: "true",
              },
            },
            badges: {
              style: "for-the-badge",
              logoColor: "white",
              includeLinks: true,
              customColors: {
                github: "181717",
                twitter: "1DA1F2",
                linkedin: "0A66C2",
                website: "4285F4",
                email: "EA4335",
                skills: {
                  javascript: "F7DF1E",
                  typescript: "3178C6",
                  react: "61DAFB",
                  nextjs: "000000",
                  nodejs: "339933",
                  python: "3776AB",
                  java: "007396",
                  docker: "2496ED",
                  kubernetes: "326CE5",
                  aws: "232F3E",
                },
              },
            },
            sections: {
              header: {
                style: "centered",
                includeWaves: true,
                addTypingEffect: true,
              },
              about: {
                style: "detailed",
                includeQuote: true,
                addStatusBadge: true,
              },
              skills: {
                style: "grid",
                groupByCategory: true,
                showProficiency: true,
              },
              statistics: {
                layout: "grid",
                includeAllStats: true,
                addSparklines: true,
              },
              projects: {
                style: "detailed",
                showPreview: true,
                includeTechStack: true,
                addDemoLinks: true,
              },
              contributions: {
                style: "detailed",
                showPrivateContributions: true,
                includeOrganizations: true,
              },
              contact: {
                style: "branded",
                includeSocialPreview: true,
                addProfileBadges: true,
              },
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate README");
      }

      const data = await response.json();
      setReadme(data.readme);
      setLastUpdate(new Date());
      toast({
        title: "Success",
        description: "README generated successfully",
      });
    } catch (error) {
      console.error("Error generating README:", error);
      toast({
        title: "Error",
        description: "Failed to generate README",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReadme = () => {
    if (!readme) return;

    const blob = new Blob([readme], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const copyToClipboard = async () => {
    if (!readme) return;

    try {
      await navigator.clipboard.writeText(readme);
      toast({
        title: "Success",
        description: "README copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy README",
        variant: "destructive",
      });
    }
  };

  const PreviewContent = ({ content }) => {
    // Function to sanitize and prepare content for rendering
    const prepareContent = (content) => {
      return content
        .replace(/\n/g, "  \n") // Ensure proper line breaks
        .replace(
          /<div align="center">/g,
          '<div style="text-align: center; width: 100%; margin: 1rem 0;">'
        ) // Add margin to centered divs
        .replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
          // Add margin to headings
          const level = hashes.length;
          return `<h${level} style="margin: 1.5rem 0 1rem 0;">${text}</h${level}>`;
        })
        .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, (_, alt, src) => {
          // Add margin to images
          return `<img src="${src}" alt="${alt}" style="margin: 0.5rem 0;">`;
        })
        .replace(/^(-|\*)\s+(.+)$/gm, (_, bullet, text) => {
          // Add margin to list items
          return `<li style="margin: 0.25rem 0;">${text}</li>`;
        })
        .replace(/\n\n/g, "<br><br>"); // Convert double newlines to line breaks
    };

    return (
      <div
        className="readme-preview markdown-body"
        style={{
          padding: "2rem",
          lineHeight: "1.6",
          fontFamily:
            "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji",
        }}
        dangerouslySetInnerHTML={{
          __html: prepareContent(content),
        }}
      />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>GitHub README Generator</span>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-sm text-muted-foreground">
                Last updated: {new Date(lastUpdate).toLocaleString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={generateReadme}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate README
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {readme ? (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                Copy to Clipboard
              </Button>
              <Button variant="outline" size="sm" onClick={downloadReadme}>
                <Download className="mr-2 h-4 w-4" />
                Download README.md
              </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-4">
                <div className="preview-container">
                  <PreviewContent content={readme} />
                </div>
                <style jsx global>{`
                  .preview-container {
                    background: var(--background);
                    border-radius: 8px;
                    overflow: hidden;
                  }

                  .readme-preview {
                    color: var(--foreground);
                    padding: 2rem;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                      Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.5;
                  }

                  .readme-preview h1 {
                    font-size: 2em;
                    margin-bottom: 16px;
                    font-weight: 600;
                    padding-bottom: 0.3em;
                    border-bottom: 1px solid var(--border);
                  }

                  .readme-preview h2 {
                    font-size: 1.5em;
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                    padding-bottom: 0.3em;
                    border-bottom: 1px solid var(--border);
                  }

                  .readme-preview h3 {
                    font-size: 1.25em;
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                  }

                  .readme-preview p {
                    margin-bottom: 16px;
                  }

                  .readme-preview img {
                    max-width: 100%;
                    height: auto;
                    margin: 8px 0;
                    border-radius: 6px;
                  }

                  .readme-preview a {
                    color: hsl(var(--primary));
                    text-decoration: none;
                  }

                  .readme-preview a:hover {
                    text-decoration: underline;
                  }

                  .readme-preview pre {
                    background-color: var(--muted);
                    border-radius: 6px;
                    padding: 16px;
                    overflow: auto;
                    font-size: 85%;
                    line-height: 1.45;
                    margin: 16px 0;
                  }

                  .readme-preview code {
                    background-color: rgba(110, 118, 129, 0.4);
                    border-radius: 6px;
                    padding: 0.2em 0.4em;
                    font-size: 85%;
                    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo,
                      Consolas, Liberation Mono, monospace;
                  }

                  .readme-preview table {
                    border-spacing: 0;
                    border-collapse: collapse;
                    margin: 16px 0;
                    width: 100%;
                  }

                  .readme-preview table th,
                  .readme-preview table td {
                    padding: 6px 13px;
                    border: 1px solid var(--border);
                  }

                  .readme-preview table tr {
                    background-color: var(--background);
                    border-top: 1px solid var(--border);
                  }

                  .readme-preview table tr:nth-child(2n) {
                    background-color: var(--muted);
                  }

                  .readme-preview ul,
                  .readme-preview ol {
                    padding-left: 2em;
                    margin: 16px 0;
                  }

                  .readme-preview li {
                    margin: 4px 0;
                  }

                  .readme-preview blockquote {
                    padding: 0 1em;
                    color: var(--muted-foreground);
                    border-left: 0.25em solid var(--border);
                    margin: 16px 0;
                  }

                  .readme-preview hr {
                    height: 0.25em;
                    padding: 0;
                    margin: 24px 0;
                    background-color: var(--border);
                    border: 0;
                  }

                  .readme-preview div[style*="text-align: center"] {
                    display: block;
                    text-align: center;
                    margin: 16px 0;
                  }

                  .readme-preview div[style*="text-align: center"] img {
                    margin: 8px auto;
                  }

                  /* Dark mode adjustments */
                  :root[class~="dark"] .readme-preview {
                    --border-color: #30363d;
                    --code-bg: #161b22;
                  }

                  :root[class~="dark"] .readme-preview a {
                    color: hsl(var(--primary));
                  }

                  :root[class~="dark"] .readme-preview code {
                    background-color: rgba(110, 118, 129, 0.1);
                  }
                `}</style>
              </TabsContent>
              <TabsContent value="markdown" className="mt-4">
                <pre className="max-h-[600px] overflow-auto rounded-lg bg-muted p-4">
                  <code>{readme}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <Github className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">
                Generate Your GitHub README
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the Generate button to create a professional README for
                your GitHub profile using AI.
              </p>
            </div>
            <Button onClick={generateReadme} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-4 w-4" />
              )}
              Generate README
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
