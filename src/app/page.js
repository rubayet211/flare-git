"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Star, GitBranch, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight">
          Make Your GitHub Profile{" "}
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Stand Out
          </span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
          Enhance your GitHub presence with beautiful themes, project showcases,
          and activity insights that help you appeal to employers and clients.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/auth/signin">
            <Button size="lg" className="gap-2">
              <Github className="h-5 w-5" />
              Get Started with GitHub
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">
          Everything you need to showcase your developer profile
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Star className="h-10 w-10 text-yellow-500" />}
            title="Custom Themes"
            description="Choose from beautiful themes or create your own to make your profile unique."
          />
          <FeatureCard
            icon={<GitBranch className="h-10 w-10 text-green-500" />}
            title="Project Portfolio"
            description="Showcase your best work with dynamic project cards and categorization."
          />
          <FeatureCard
            icon={<Activity className="h-10 w-10 text-blue-500" />}
            title="Activity Insights"
            description="Visualize your coding activity and highlight your achievements."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 FlareGit. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
