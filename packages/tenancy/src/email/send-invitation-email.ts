/**
 * Send Invitation Email
 * 
 * High-level function to send invitation emails using Resend.
 */

import type { TenancyInvitationRow } from '../drizzle/tenancy.schema';
import { sendEmail } from './resend-client';
import { tenancyLogger } from '../logger';
import {
  generateInvitationEmailHtml,
  generateInvitationEmailSubject,
  type InvitationEmailData,
} from './templates/invitation-email';

export interface SendInvitationEmailParams {
  invitation: TenancyInvitationRow;
  inviterName: string;
  entityType: 'organization' | 'team';
  entityName: string;
  baseUrl: string; // e.g., "https://yourdomain.com"
}

/**
 * Send an invitation email
 * 
 * @param params - Invitation email parameters
 * @returns Promise with success status and message ID
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: boolean; messageId?: string; error?: unknown }> {
  const { invitation, inviterName, entityType, entityName, baseUrl } = params;

  // Construct acceptance URL
  const acceptUrl = `${baseUrl}/tenancy/invitations/${invitation.token}`;

  // Prepare email data
  const emailData: InvitationEmailData = {
    inviteeEmail: invitation.email,
    inviterName,
    entityType,
    entityName,
    role: invitation.role,
    personalMessage: invitation.message ?? undefined,
    acceptUrl,
    expiresAt: invitation.expiresAt,
  };

  // Generate email content
  const subject = generateInvitationEmailSubject(emailData);
  const html = generateInvitationEmailHtml(emailData);

  // Send email
  const result = await sendEmail({
    to: invitation.email,
    subject,
    html,
  });

  if (result.success) {
    tenancyLogger.info(
      { messageId: result.messageId, invitationId: invitation.id },
      `Invitation email sent to ${invitation.email}`,
    );
  } else {
    tenancyLogger.error(
      { err: result.error, invitationId: invitation.id },
      `Failed to send invitation email to ${invitation.email}`,
    );
  }

  return result;
}
