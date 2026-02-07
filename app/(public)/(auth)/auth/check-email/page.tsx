/**
 * Auth check-email page — shown after reset-email sent, etc.
 * URL: /auth/check-email (?type=reset-email | verify-email | magic-link).
 * Avoids conflict with (marketing)/status (platform status page).
 * @see https://neon.com/docs/auth/guides/password-reset
 */

import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Mail, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Check your email",
  description: "Password reset or verification email sent",
  robots: { index: false, follow: false },
};

type StatusType = "reset-email" | "verify-email" | "magic-link";

const STATUS_CONFIG: Record<
  StatusType,
  { title: string; description: string; icon: React.ReactNode }
> = {
  "reset-email": {
    title: "Check your email",
    description:
      "If an account exists for that address, we've sent a password reset link. The link expires in 15 minutes. Check your spam folder if you don't see it.",
    icon: <Mail className="size-10 text-muted-foreground" />,
  },
  "verify-email": {
    title: "Verify your email",
    description:
      "We've sent a verification link to your email. Click the link to verify your account.",
    icon: <Mail className="size-10 text-muted-foreground" />,
  },
  "magic-link": {
    title: "Check your email",
    description:
      "We've sent you a sign-in link. Click the link in the email to sign in.",
    icon: <Mail className="size-10 text-muted-foreground" />,
  },
};

export default async function AuthCheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type = (params.type ?? "reset-email") as StatusType;
  const config = STATUS_CONFIG[type] ?? STATUS_CONFIG["reset-email"];

  return (
    <main className="container mx-auto flex min-h-svh flex-col items-center justify-center gap-6 p-4 md:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          {config.icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Link
            href={routes.ui.auth.login()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
          {type === "reset-email" && (
            <Link
              href={routes.ui.auth.forgotPassword()}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Request another reset link
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
