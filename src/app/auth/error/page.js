"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">
            {error === "Configuration" &&
              "There is a problem with the server configuration."}
            {error === "AccessDenied" &&
              "Access denied. You are not authorized."}
            {error === "Verification" &&
              "The verification token has expired or has already been used."}
            {!error && "An unknown error occurred."}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
