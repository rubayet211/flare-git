"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Star,
  GitFork,
  ExternalLink,
  Search,
  CheckCircle2,
  Circle,
} from "lucide-react";

export function RepositoryList({
  repositories,
  featuredProjects,
  onToggleFeature,
  searchQuery,
  onSearch,
  loading,
}) {
  const [sortBy, setSortBy] = useState("stars");

  const sortRepositories = (repos) => {
    return [...repos].sort((a, b) => {
      switch (sortBy) {
        case "stars":
          return b.stargazers_count - a.stargazers_count;
        case "forks":
          return b.forks_count - a.forks_count;
        case "updated":
          return new Date(b.updated_at) - new Date(a.updated_at);
        default:
          return 0;
      }
    });
  };

  const sortedRepositories = sortRepositories(repositories || []);

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="whitespace-nowrap">
            Sort by:
          </Label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border bg-background px-3 py-1"
          >
            <option value="stars">Stars</option>
            <option value="forks">Forks</option>
            <option value="updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Repository Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="mt-4 h-16 rounded bg-muted" />
              <div className="mt-4 flex justify-between">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedRepositories.map((repo) => (
            <Card key={repo.id} className="flex flex-col justify-between p-6">
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{repo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {repo.description || "No description provided"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleFeature(repo)}
                  >
                    {featuredProjects?.some((p) => p.id === repo.id) ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {repo.topics?.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
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
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
