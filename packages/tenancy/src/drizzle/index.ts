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
  tenancyAuditLogs,
  tenancyInvitations,
  type TenancyOrganizationRow,
  type TenancyOrganizationInsert,
  type TenancyTeamRow,
  type TenancyTeamInsert,
  type TenancyMembershipRow,
  type TenancyMembershipInsert,
  type TenancyTenantDesignSystemRow,
  type TenancyTenantDesignSystemInsert,
  type TenancyAuditLogRow,
  type TenancyAuditLogInsert,
  type TenancyInvitationRow,
  type TenancyInvitationInsert,
} from "./tenancy.schema";

export {
  TENANCY_DB_COLUMNS,
  tenancyColumns,
  tenancyIndexes,
  type TenancyColumnsWithLegacy,
  type TenancyColumnsStandard,
  type TenancyColumnsRequired,
} from "./tenancy-columns";

export {
  tenancyForeignKeys,
  type TenancyFkOnDelete,
  type TenancyForeignKeysOptions,
} from "./tenancy-foreign-keys";
