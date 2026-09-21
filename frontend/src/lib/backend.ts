/**
 * Server-side base URL of the backend API.
 *
 * Keep the fallback in sync with `next.config.ts` rewrites. There is
 * deliberately no localhost fallback: if the env var is missing in a deployed
 * environment we point at the production backend rather than silently
 * self-referencing.
 */
export function getBackendUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://lettyecommerce.onrender.com"
  );
}
