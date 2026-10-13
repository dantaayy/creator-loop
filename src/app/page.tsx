import { Suspense } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Placeholder home until the Week screen arrives (M2/M6).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-6 h-px w-10 bg-bronze" aria-hidden="true" />
      <h1 className="text-4xl leading-tight font-medium">Creator Loop</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Capture ideas, plan a week you can sustain, and keep an eye on your energy and runway.
      </p>
      <Suspense>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div className="mt-10 flex items-center justify-between gap-4 border-t pt-6">
      <p className="truncate text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{user.email}</span>
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
