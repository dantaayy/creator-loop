import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Database tests run against the hosted Supabase project using keys from .env.
// Kept apart from `npm test` so unit tests never touch the live database.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
