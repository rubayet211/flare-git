import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: June 3, 2026</p>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-sm text-muted-foreground">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing or using FlareGit, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. User Account and GitHub OAuth</h2>
          <p>
            To use our services, you must sign in via GitHub OAuth. You are responsible for maintaining the security of your GitHub account and credentials. FlareGit is not liable for unauthorized access or loss of data resulting from compromise of your GitHub account credentials.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use</h2>
          <p>
            You agree not to use the platform to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Attempt to hijack custom URLs or slugs belonging to other users.</li>
            <li>Commit malicious, spam, or abusive README text content back to public/private repositories on GitHub.</li>
            <li>Bypass rate limits, reverse-engineer API endpoints, or compromise session handling mechanisms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. AI Features & Generation Limits</h2>
          <p>
            FlareGit uses Google&apos;s Gemini models via OpenRouter to generate readmes and bio content. While we strive for professional output, we are not responsible for AI hallucinations, formatting bugs, or incorrect statements in generated files. Users should review and edit AI outputs before committing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to FlareGit at our discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the platform.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <p className="text-xs italic">
            Disclaimer: This terms document is a generic beta placeholder. Please consult with qualified legal counsel before releasing your product to production.
          </p>
        </section>
      </div>
    </div>
  );
}
