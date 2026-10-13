"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export type SignInState =
  { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

const signInSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
});

export async function sendMagicLink(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: "That doesn't look like an email address." };
  }

  const origin = (await headers()).get("origin");
  if (!origin) return { status: "error", message: "Something went wrong. Try again." };

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeNextPath(parsed.data.next));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: callback.toString() },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.status === 429
          ? "Too many sign-in emails just now. Try again in a few minutes."
          : "We couldn't send the link. Try again.",
    };
  }
  return { status: "sent", email: parsed.data.email };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
