import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/tenancy/tenant/active
 * Returns the currently active tenant from cookies
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  const orgId = cookieStore.get("activeTenantOrgId")?.value;
  const teamId = cookieStore.get("activeTenantTeamId")?.value;

  // Team takes precedence over org
  if (teamId) {
    return NextResponse.json({
      type: "team",
      id: teamId,
      organizationId: orgId || undefined,
    });
  }

  if (orgId) {
    return NextResponse.json({
      type: "org",
      id: orgId,
    });
  }

  // No active tenant
  return NextResponse.json({ type: null, id: null }, { status: 200 });
}
