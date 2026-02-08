/**
 * Invitation Email Template
 * 
 * HTML email template for organization/team invitations.
 * Uses inline styles for maximum email client compatibility.
 */

export interface InvitationEmailData {
  inviteeEmail: string;
  inviterName: string;
  entityType: 'organization' | 'team';
  entityName: string;
  role: string;
  personalMessage?: string;
  acceptUrl: string;
  expiresAt: Date;
}

/**
 * Generate invitation email HTML
 */
export function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const {
    inviterName,
    entityType,
    entityName,
    role,
    personalMessage,
    acceptUrl,
    expiresAt,
  } = data;

  const entityLabel = entityType === 'organization' ? 'Organization' : 'Team';
  const expiryDate = expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join the <strong>${entityLabel.toLowerCase()}</strong> <strong>${entityName}</strong> as a <strong>${role}</strong>.
              </p>

              ${personalMessage ? `
              <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; font-style: italic; line-height: 1.6;">
                  "${personalMessage}"
                </p>
              </div>
              ` : ''}

              <!-- Entity Details Card -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 24px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Type:</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${entityLabel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Name:</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${entityName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Your Role:</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${role}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Invited By:</span>
                      <span style="color: #111827; font-size: 14px; font-weight: 500; margin-left: 8px;">${inviterName}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                  Accept Invitation
                </a>
              </div>

              <!-- Expiry Warning -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                  ⏰ <strong>Note:</strong> This invitation expires on <strong>${expiryDate}</strong>. Please accept before this date.
                </p>
              </div>

              <!-- Alternative Link -->
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; text-align: center;">
                <a href="${acceptUrl}" style="color: #667eea; font-size: 12px; word-break: break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                This invitation was sent to <strong>${data.inviteeEmail}</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center; line-height: 1.5;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate invitation email subject line
 */
export function generateInvitationEmailSubject(data: InvitationEmailData): string {
  const { inviterName, entityType, entityName } = data;
  const entityLabel = entityType === 'organization' ? 'organization' : 'team';
  return `${inviterName} invited you to join ${entityName} (${entityLabel})`;
}
