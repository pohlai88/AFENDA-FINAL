"use client";

import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import { authClient } from "@afenda/auth/client";
import { routes } from "@afenda/shared/constants";

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth UI paths — basePath "/auth" gives /auth/sign-in, /auth/sign-up.
 * Redirect pages (/login, /register, etc.) forward to these URLs per plan.
 */
const authViewPaths = {
  SIGN_IN: "sign-in",
  SIGN_UP: "sign-up",
  FORGOT_PASSWORD: "forgot-password",
  RESET_PASSWORD: "reset-password",
  CALLBACK: "callback",
  SIGN_OUT: "sign-out",
  EMAIL_OTP: "email-otp",
  MAGIC_LINK: "magic-link",
  RECOVER_ACCOUNT: "recover-account",
  TWO_FACTOR: "two-factor",
  ACCEPT_INVITATION: "accept-invitation",
} as const;

/**
 * Auth context provider. Wraps the app with Neon Auth UI context.
 * OAuth: Google and GitHub. Credentials: email/password with forgot password.
 *
 * @layer app/components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo={routes.ui.orchestra.dashboard()}
      basePath="/auth"
      viewPaths={authViewPaths}
      social={{ providers: ["google", "github"] }}
      credentials={{ forgotPassword: true }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
