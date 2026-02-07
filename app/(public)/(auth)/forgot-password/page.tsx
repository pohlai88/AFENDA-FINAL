/**
 * Forgot password redirect — /forgot-password → /auth/forgot-password.
 */

import { redirect } from "next/navigation";

export default function ForgotPasswordPage() {
  redirect("/auth/forgot-password");
}
