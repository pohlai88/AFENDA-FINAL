/**
 * Email Module
 * 
 * Email functionality for tenancy domain using Resend.
 */

export { getResendClient, sendEmail, DEFAULT_FROM_EMAIL } from './resend-client';
export type { SendEmailOptions } from './resend-client';

export { sendInvitationEmail } from './send-invitation-email';
export type { SendInvitationEmailParams } from './send-invitation-email';

export {
  generateInvitationEmailHtml,
  generateInvitationEmailSubject,
} from './templates/invitation-email';
export type { InvitationEmailData } from './templates/invitation-email';
