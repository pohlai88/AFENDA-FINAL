/**
 * Auth layout — imports auth-scoped styles only.
 * Root layout already wraps with AuthProvider (NeonAuthUIProvider).
 */

import type { ReactNode } from "react";
import "../../auth-styles.css";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
