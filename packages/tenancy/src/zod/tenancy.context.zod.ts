/**
 * @domain tenancy
 * @layer zod
 * @responsibility Tenant context for multi-tenant operations
 */

import { z } from "zod";

export const tenancyContextSchema = z.object({
  tenantId: z.string(),
  organizationId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});

export type TenancyContext = z.infer<typeof tenancyContextSchema>;
