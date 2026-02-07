/**
 * @domain tenancy
 * @layer drizzle
 * @responsibility Tenancy database schema barrel
 */

export {
  tenancyOrganizations,
  tenancyTeams,
  tenancyMemberships,
  tenancyTenantDesignSystem,
  type TenancyOrganizationRow,
  type TenancyOrganizationInsert,
  type TenancyTeamRow,
  type TenancyTeamInsert,
  type TenancyMembershipRow,
  type TenancyMembershipInsert,
  type TenancyTenantDesignSystemRow,
  type TenancyTenantDesignSystemInsert,
} from "./tenancy.schema";
