/**
 * Get the application base URL for server-side fetch (RSC, API routes).
 * Uses NEXT_PUBLIC_APP_URL or VERCEL_URL when available.
 *
 * @domain shared
 * @layer server
 */
export function getAppBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (url) {
    return url.startsWith("http") ? url : `https://${url}`;
  }
  return "http://localhost:3000";
}
