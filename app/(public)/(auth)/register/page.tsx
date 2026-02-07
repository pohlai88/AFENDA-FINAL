/**
 * Register redirect — /register → /auth/sign-up (URL policy per routes.ui.auth).
 */

import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/auth/sign-up");
}
