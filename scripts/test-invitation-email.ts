/**
 * Test Script: Send Invitation Email
 * 
 * Usage: tsx scripts/test-invitation-email.ts your-email@example.com
 * 
 * This script tests the invitation email functionality by sending a test email.
 */

import { sendInvitationEmail } from "../packages/tenancy/src/email/send-invitation-email";

async function testInvitationEmail(recipientEmail: string) {
  console.log("🧪 Testing Invitation Email System...\n");

  // Mock invitation data
  const mockInvitation = {
    id: "test_invitation_" + Date.now(),
    token: "test_token_" + Math.random().toString(36).substring(7),
    email: recipientEmail,
    role: "member" as const,
    message: "Welcome to our team! We're excited to have you join us.",
    organizationId: "test_org_123",
    teamId: null,
    status: "pending" as const,
    invitedBy: "test_user_456",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    console.log("📧 Sending test invitation email to:", recipientEmail);
    console.log("📨 From:", process.env.DEFAULT_FROM_EMAIL || "onboarding@resend.dev");
    console.log("🔑 Using API Key:", process.env.RESEND_API_KEY?.substring(0, 10) + "...\n");

    const result = await sendInvitationEmail({
      invitation: mockInvitation,
      inviterName: "Admin User (Test)",
      entityType: "organization",
      entityName: "AFENDA Test Organization",
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    });

    if (result.success) {
      console.log("✅ SUCCESS! Email sent successfully!");
      console.log("📬 Message ID:", result.messageId);
      console.log("\n🔍 Check your inbox at:", recipientEmail);
      console.log("📝 Subject: Admin User (Test) invited you to join AFENDA Test Organization (organization)");
      console.log("\n⚠️  If you don't see it:");
      console.log("   1. Check your spam folder");
      console.log("   2. Wait 1-2 minutes (Resend can have delays)");
      console.log("   3. Verify RESEND_API_KEY is correct in .env");
    } else {
      console.error("❌ FAILED to send email!");
      console.error("Error:", result.error);
      console.log("\n🔧 Troubleshooting:");
      console.log("   1. Check RESEND_API_KEY in .env is valid");
      console.log("   2. Verify Resend account is active");
      console.log("   3. Check domain verification if using custom domain");
    }
  } catch (error) {
    console.error("❌ ERROR:", error);
    console.log("\n🔧 Common issues:");
    console.log("   • RESEND_API_KEY not set or invalid");
    console.log("   • Network connection issues");
    console.log("   • Resend service temporarily down");
  }
}

// Get email from command line argument
const recipientEmail = process.argv[2];

if (!recipientEmail) {
  console.error("❌ Please provide a recipient email address");
  console.log("\nUsage: tsx scripts/test-invitation-email.ts your-email@example.com");
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipientEmail)) {
  console.error("❌ Invalid email format:", recipientEmail);
  process.exit(1);
}

// Run test
testInvitationEmail(recipientEmail).catch(console.error);
