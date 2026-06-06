import { Suspense } from "react";
import { AuthErrorContent } from "./auth-error-content";

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
