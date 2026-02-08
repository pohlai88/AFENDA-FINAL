/**
 * @domain tenancy
 * @layer zod
 * @responsibility Invitation API contract schemas
 * Phase 3: Email-based invitation validation
 */

import { z } from "zod";

/** Status enum for invitations */
export const tenancyInvitationStatus = z.enum([
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "expired",
]);

export type TenancyInvitationStatus = z.infer<typeof tenancyInvitationStatus>;

/** Create organization invitation request */
export const tenancyCreateOrgInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member"]),
  message: z.string().max(500).optional(),
});

export type TenancyCreateOrgInvitation = z.infer<typeof tenancyCreateOrgInvitationSchema>;

/** Create team invitation request */
export const tenancyCreateTeamInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["lead", "member"]),
  message: z.string().max(500).optional(),
});

export type TenancyCreateTeamInvitation = z.infer<typeof tenancyCreateTeamInvitationSchema>;

/** Accept invitation request */
export const tenancyAcceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type TenancyAcceptInvitation = z.infer<typeof tenancyAcceptInvitationSchema>;

/** Decline invitation request */
export const tenancyDeclineInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type TenancyDeclineInvitation = z.infer<typeof tenancyDeclineInvitationSchema>;

/** Invitation response schema */
export const tenancyInvitationResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().nullable(),
  teamId: z.string().nullable(),
  role: z.string(),
  token: z.string(),
  invitedBy: z.string(),
  message: z.string().nullable(),
  status: tenancyInvitationStatus,
  acceptedBy: z.string().nullable(),
  acceptedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TenancyInvitationResponse = z.infer<typeof tenancyInvitationResponseSchema>;

/** Invitation list item (includes org/team name from joins) */
export const tenancyInvitationListItemSchema = tenancyInvitationResponseSchema.extend({
  orgName: z.string().nullable().optional(),
  orgSlug: z.string().nullable().optional(),
  teamName: z.string().nullable().optional(),
});

export type TenancyInvitationListItem = z.infer<typeof tenancyInvitationListItemSchema>;

/** Invitation list response */
export const tenancyInvitationListResponseSchema = z.object({
  invitations: z.array(tenancyInvitationListItemSchema),
});

export type TenancyInvitationListResponse = z.infer<
  typeof tenancyInvitationListResponseSchema
>;

/** Invitation details for acceptance page */
export const tenancyInvitationDetailsSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().nullable(),
  teamId: z.string().nullable(),
  role: z.string(),
  message: z.string().nullable(),
  status: tenancyInvitationStatus,
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  orgName: z.string().nullable(),
  orgSlug: z.string().nullable(),
  teamName: z.string().nullable(),
  inviterName: z.string().optional(),
});

export type TenancyInvitationDetails = z.infer<typeof tenancyInvitationDetailsSchema>;

