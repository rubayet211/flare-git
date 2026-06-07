"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, GitFork } from "lucide-react";
import { Card } from "@/components/ui/card";

export function RepositorySelector({ open, onOpenChange, onSelect }) {
  const { data: session } = useSession();
  const username = session?.user?.username;
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (!username) {
        console.log("No username found in session");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("Fetching repositories for:", username);
        const response = await fetch(
          `/api/github/repositories/${username}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch repositories");
        }
        const data = await response.json();
        console.log("Fetched repositories:", data);
        setRepositories(data);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchRepositories();
    }
  }, [open, username]);

  const filteredRepositories = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Repository</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : filteredRepositories.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No repositories found
            </div>
          ) : (
            filteredRepositories.map((repo) => (
              <Card
                key={repo.id}
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
                onClick={() => {
                  onSelect(repo);
                  onOpenChange(false);
                }}
              >
                <div>
                  <h3 className="font-medium">{repo.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {repo.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center text-sm text-muted-foreground">
                    <Star className="mr-1 h-4 w-4" />
                    {repo.stargazers_count}
                  </span>
                  <span className="flex items-center text-sm text-muted-foreground">
                    <GitFork className="mr-1 h-4 w-4" />
                    {repo.forks_count}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
