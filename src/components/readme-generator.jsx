import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
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
            style: "professional",
            sections: [
              "introduction",
              "skills",
              "stats",
              "projects",
              "contact",
            ],
            theme: "default",
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
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {readme}
                  </ReactMarkdown>
                </div>
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
