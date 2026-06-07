"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signIn("github", {
        callbackUrl,
        redirect: true,
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Failed to sign in with GitHub",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to FlareGit
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in with GitHub to continue
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error === "OAuthSignin" && "Error connecting to GitHub."}
          {error === "OAuthCallback" && "Error during GitHub callback."}
          {error === "OAuthCreateAccount" &&
            "Could not create GitHub account."}
          {error === "Callback" && "Invalid callback URL."}
          {error === "AccessDenied" && "Access denied by GitHub."}
          {!error.match(/^OAuth|Callback|AccessDenied$/) &&
            "An unexpected error occurred."}
        </div>
      )}

      <Button
        variant="outline"
        type="button"
        className="w-full"
        onClick={handleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Connecting...
          </span>
        ) : (
          <>
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </>
        )}
      </Button>

      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
