/**
 * Resend Email Client
 * 
 * Centralized Resend client configuration for sending transactional emails.
 * Uses RESEND_API_KEY from environment variables.
 * Lazy-initialized to avoid crashing at module-load time when key is absent.
 */

import { Resend } from 'resend';
import { tenancyLogger } from '../logger';

let _resendClient: Resend | null = null;

/**
 * Lazy singleton Resend client — only created on first call.
 * Throws if RESEND_API_KEY is missing at call time (not import time).
 */
export function getResendClient(): Resend {
  if (!_resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return _resendClient;
}

/**
 * Default email sender configuration
 * TODO: Update DEFAULT_FROM_EMAIL with your verified domain on Resend
 * Example: noreply@yourdomain.com
 */
export const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Email send options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, from = DEFAULT_FROM_EMAIL, replyTo } = options;

  try {
    const resend = getResendClient();
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    tenancyLogger.error({ err: error }, 'Failed to send email');
    return { success: false, error };
  }
}
