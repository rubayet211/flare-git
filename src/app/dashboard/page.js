"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Linkedin, Twitter, Globe, MapPin, User } from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import { ThemePreview } from "@/components/theme-preview";
import { RepositoryList } from "@/components/repository-list";
import { GitHubService } from "@/lib/github";
import { GitHubAnalytics } from "@/components/github-analytics";
import { ReadmeEditor } from "@/components/readme-editor";
import { ReadmeGenerator } from "@/components/readme-generator";
import { RepositoryReadmeGenerator } from "@/components/repository-readme-generator";

const defaultTheme = {
  primary: "#3b82f6",
  background: "#ffffff",
  card: "#f8fafc",
  text: "#1e293b",
  heading: "#0f172a",
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(defaultTheme);
  const [repositories, setRepositories] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customUrl: "",
    location: "",
    website: "",
    twitter: "",
    linkedin: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    if (profile?.githubUsername) {
      fetchRepositories();
    }
  }, [profile?.githubUsername]);

  useEffect(() => {
    if (profile) {
      setFormData({
        customUrl: profile.customUrl || "",
        location: profile.location || "",
        website: profile.website || "",
        twitter: profile.twitter || "",
        linkedin: profile.linkedin || "",
      });
      setTheme(profile.customTheme || defaultTheme);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile/${session.user.id}`);
      const data = await response.json();
      setProfile(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch(
        `/api/github/repositories/${profile.githubUsername}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const data = await response.json();
      setRepositories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      toast({
        title: "Error",
        description: "Failed to load repositories",
        variant: "destructive",
      });
      setRepositories([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThemeChange = (key, value) => {
    setTheme((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleFeature = async (repo) => {
    const currentFeatured = profile.featuredProjects || [];
    const isCurrentlyFeatured = currentFeatured.some((p) => p.id === repo.id);
    const updatedFeatured = isCurrentlyFeatured
      ? currentFeatured.filter((p) => p.id !== repo.id)
      : [...currentFeatured, repo];

    try {
      const response = await fetch(`/api/profile/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profile,
          featuredProjects: updatedFeatured,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update featured projects");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast({
        title: "Success",
        description: isCurrentlyFeatured
          ? "Project removed from featured list"
          : "Project added to featured list",
      });
    } catch (error) {
      console.error("Error updating featured projects:", error);
      toast({
        title: "Error",
        description: "Failed to update featured projects",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/profile/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          customTheme: theme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredRepositories = searchQuery
    ? (repositories || []).filter(
        (repo) =>
          repo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : repositories || [];

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-4xl font-bold">Dashboard</h1>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View your GitHub information and customize additional profile
                details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GitHub Information - Read Only */}
              <div className="space-y-4 rounded-lg bg-muted p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-background">
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">GitHub Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Your GitHub profile information
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="githubUsername">
                      <Github className="mr-2 inline-block h-4 w-4" />
                      GitHub Username
                    </Label>
                    <Input
                      id="githubUsername"
                      value={
                        session?.user?.username || profile?.githubUsername || ""
                      }
                      readOnly
                      disabled
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubName">
                      <Github className="mr-2 inline-block h-4 w-4" />
                      Name
                    </Label>
                    <Input
                      id="githubName"
                      value={session?.user?.name || ""}
                      readOnly
                      disabled
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubEmail">
                      <Github className="mr-2 inline-block h-4 w-4" />
                      GitHub Email
                    </Label>
                    <Input
                      id="githubEmail"
                      value={session?.user?.email || ""}
                      readOnly
                      disabled
                      className="bg-background"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="githubBio">
                      <Github className="mr-2 inline-block h-4 w-4" />
                      GitHub Bio
                    </Label>
                    <textarea
                      id="githubBio"
                      className="w-full rounded-md border bg-background p-2"
                      rows={2}
                      value={session?.user?.bio || profile?.bio || ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Custom Profile Information - Editable */}
              <div className="space-y-4">
                <h3 className="font-medium">Custom Profile Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="customUrl">Custom Profile URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      flaregit.com/
                    </span>
                    <Input
                      id="customUrl"
                      name="customUrl"
                      placeholder={profile?.githubUsername || "custom-url"}
                      value={formData.customUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be your public profile URL. Leave empty to use
                    your GitHub username.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">
                      <Twitter className="mr-2 inline-block h-4 w-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      placeholder="@username"
                      value={formData.twitter}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">
                      <Linkedin className="mr-2 inline-block h-4 w-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      placeholder="linkedin-profile"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">
                      <Globe className="mr-2 inline-block h-4 w-4" />
                      Personal Website
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://your-website.com"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="mr-2 inline-block h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <Button className="mt-4" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repositories">
          <RepositoryReadmeGenerator />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View your GitHub activity and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.githubUsername ? (
                <GitHubAnalytics username={profile.githubUsername} />
              ) : (
                <p>GitHub username not found. Please update your profile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize your profile's appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  color={theme.primary}
                  onChange={(color) => handleThemeChange("primary", color)}
                />
                <ColorPicker
                  label="Background Color"
                  color={theme.background}
                  onChange={(color) => handleThemeChange("background", color)}
                />
                <ColorPicker
                  label="Card Color"
                  color={theme.card}
                  onChange={(color) => handleThemeChange("card", color)}
                />
                <ColorPicker
                  label="Text Color"
                  color={theme.text}
                  onChange={(color) => handleThemeChange("text", color)}
                />
                <ColorPicker
                  label="Heading Color"
                  color={theme.heading}
                  onChange={(color) => handleThemeChange("heading", color)}
                />
                <Button
                  className="mt-4 w-full"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Theme"}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preview</h3>
              <ThemePreview theme={theme} profile={profile} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="mb-8 h-12 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
