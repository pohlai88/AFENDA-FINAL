/**
 * Reset password redirect — /reset-password → /auth/reset-password.
 */

import { redirect } from "next/navigation";

export default function ResetPasswordPage() {
  redirect("/auth/reset-password");
}
