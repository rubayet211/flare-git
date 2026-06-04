import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 3, 2026</p>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p>
            Welcome to FlareGit. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <p>
            When you sign in using GitHub OAuth, we request access to your GitHub account information, including your public profile data, email address, and repository telemetry. This data is used solely to generate portfolio analytics and compile repository readmes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>
            We use the data collected from GitHub to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Generate customized GitHub profile READMEs and developer biography descriptions.</li>
            <li>Construct public developer portfolio landing pages that display your statistics and repository highlights.</li>
            <li>Analyze programming language percentages, star counts, fork data, and contribution trends.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Access Tokens Security</h2>
          <p>
            Your GitHub OAuth access tokens are stored securely in our database and are used server-side only when making proxy requests to the GitHub API. We do not serialize or expose access tokens to the browser client, mitigating the risk of credential leakage.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Data Deletion</h2>
          <p>
            You can delete your FlareGit profile and disconnect your GitHub account at any time from the settings tab. Deleting your profile will permanently remove all saved customizations, themes, and biography summaries from our database.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <p className="text-xs italic">
            Disclaimer: This privacy document is a generic beta placeholder. Please consult with qualified legal counsel before releasing your product to production.
          </p>
        </section>
      </div>
    </div>
  );
}
