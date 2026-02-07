/**
 * Neon AuthView — dynamic route for sign-in, sign-up, forgot-password, reset-password, etc.
 * Uses a client-only wrapper to avoid hydration mismatch from form field ids (useId).
 */

import { AuthViewClient } from "../../_components/AuthViewClient";

export const dynamicParams = false;

const ALLOWED_PATHS = [
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "callback",
  "sign-out",
  "email-otp",
  "magic-link",
  "recover-account",
  "two-factor",
  "accept-invitation",
] as const;

export async function generateStaticParams() {
  return ALLOWED_PATHS.map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const viewPath = ALLOWED_PATHS.includes(path as (typeof ALLOWED_PATHS)[number])
    ? path
    : "sign-in";
  return (
    <main className="container mx-auto flex min-h-svh flex-col items-center justify-center gap-3 p-4 md:p-6">
      <AuthViewClient path={viewPath} />
    </main>
  );
}
