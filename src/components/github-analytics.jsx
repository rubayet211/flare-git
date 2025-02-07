"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Star, GitFork, Book } from "lucide-react";

function transformContributionData(weeks) {
  if (!weeks) return [];
  return weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );
}

function formatDate(dateStr) {
  const [year, month] = dateStr.split("-");
  const date = new Date(year, month - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

export function GitHubAnalytics({ username }) {
  const [contributions, setContributions] = useState(null);
  const [languages, setLanguages] = useState(null);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [contributionsRes, languagesRes, statsRes, trendsRes] =
          await Promise.all([
            fetch(`/api/github/contributions/${username}`),
            fetch(`/api/github/languages/${username}`),
            fetch(`/api/github/stats/${username}`),
            fetch(`/api/github/trends/${username}`),
          ]);

        const contributionsData = await contributionsRes.json();
        const languagesData = await languagesRes.json();
        const statsData = await statsRes.json();
        const trendsData = await trendsRes.json();

        setContributions(contributionsData);
        setLanguages(languagesData);
        setStats(statsData);
        setTrends(
          trendsData.map((t) => ({
            ...t,
            date: formatDate(t.date),
          }))
        );
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchAnalytics();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse p-6">
            <div className="h-[200px] rounded bg-muted" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Repository Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <h3 className="text-lg font-semibold">Total Stars</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {stats?.totalStats.totalStars || 0}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <GitFork className="h-4 w-4 text-blue-400" />
            <h3 className="text-lg font-semibold">Total Forks</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {stats?.totalStats.totalForks || 0}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Book className="h-4 w-4 text-green-400" />
            <h3 className="text-lg font-semibold">Total Repositories</h3>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {stats?.totalStats.totalRepos || 0}
          </p>
        </Card>
      </div>

      {/* Top Repositories */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Top Repositories</h3>
        <div className="space-y-4">
          {stats?.topRepos.map((repo) => (
            <div key={repo.name} className="flex items-center justify-between">
              <span className="font-medium">{repo.name}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  {repo.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-4 w-4 text-blue-400" />
                  {repo.forks}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contribution Trends */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Contribution Trends</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                name="Contributions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Contribution Calendar */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Contribution Activity</h3>
        <div className="space-y-4">
          <div className="h-[200px] w-full">
            <CalendarHeatmap
              startDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
              endDate={new Date()}
              values={transformContributionData(
                contributions?.contributionCalendar?.weeks
              )}
              classForValue={(value) => {
                if (!value || value.count === 0) return "color-empty";
                if (value.count <= 3) return "color-scale-1";
                if (value.count <= 6) return "color-scale-2";
                if (value.count <= 9) return "color-scale-3";
                return "color-scale-4";
              }}
              titleForValue={(value) =>
                value
                  ? `${value.count} contributions on ${value.date}`
                  : "No contributions"
              }
            />
          </div>
        </div>
      </Card>

      {/* Contribution Stats */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Contribution Summary</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Contributions</p>
            <p className="text-2xl font-bold">
              {contributions?.contributionCalendar.totalContributions || 0}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Commits</p>
              <p className="text-xl font-semibold">
                {contributions?.totalCommitContributions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pull Requests</p>
              <p className="text-xl font-semibold">
                {contributions?.totalPullRequestContributions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issues</p>
              <p className="text-xl font-semibold">
                {contributions?.totalIssueContributions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reviews</p>
              <p className="text-xl font-semibold">
                {contributions?.totalPullRequestReviewContributions || 0}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Distribution */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Language Distribution</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={languages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit="%" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="percentage" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
