/**
 * Redirect /auth/status → /auth/check-email (avoids conflict with marketing /status).
 */

import { redirect } from "next/navigation";

export default function AuthStatusRedirect() {
  redirect("/auth/check-email");
}
