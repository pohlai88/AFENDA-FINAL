/**
 * Login redirect — /login → /auth/sign-in (URL policy per routes.ui.auth).
 */

import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/auth/sign-in");
}
