import { Suspense } from "react";
import { SignInContent } from "./signin-content";

export default function SignIn() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
