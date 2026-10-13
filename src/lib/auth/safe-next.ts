// Where to send the user after sign-in. Only same-site paths are allowed, so a crafted
// magic link can't bounce someone to another website.
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/")) return fallback;
  // "//host" and "/\host" are treated as other sites by browsers; control characters
  // (tabs, newlines) are stripped by browsers and can turn "/\t/host" into "//host".
  if (next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  return next;
}
