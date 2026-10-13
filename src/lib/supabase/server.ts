import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

// Supabase client for Server Components, Server Actions and Route Handlers.
// Runs as the signed-in user, so RLS applies to every query.
export async function createClient() {
  const cookieStore = await cookies();
  // Next can prerender with cookies already known, but the client reads Date.now() to check
  // session expiry, which Next forbids while prerendering. Wait for the real request instead.
  await connection();
  const { url, key } = supabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}
