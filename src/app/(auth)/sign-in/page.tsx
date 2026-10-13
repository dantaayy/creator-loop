import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Creator Loop" };

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-6 h-px w-10 bg-bronze" aria-hidden="true" />
      <h1 className="text-4xl leading-tight font-medium">Creator Loop</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Sign in with your email. We&apos;ll send you a link, no password needed.
      </p>
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
