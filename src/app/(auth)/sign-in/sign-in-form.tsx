"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type SignInState } from "../actions";

const LINK_ERROR = "That sign-in link didn't work. It may have expired, so send a new one.";

export function SignInForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<SignInState, FormData>(sendMagicLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div className="mt-10 rounded-lg border bg-card p-5" role="status">
        <h2 className="text-xl font-medium">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We sent a sign-in link to <span className="text-foreground">{state.email}</span>. Open it
          on this device to finish signing in.
        </p>
      </div>
    );
  }

  const message =
    state.status === "error"
      ? state.message
      : searchParams.get("error") === "link"
        ? LINK_ERROR
        : null;

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-3">
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        aria-describedby={message ? "sign-in-message" : undefined}
      />
      {message && (
        <p id="sign-in-message" className="text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-2" disabled={pending}>
        {pending ? "Sending…" : "Send sign-in link"}
      </Button>
    </form>
  );
}
