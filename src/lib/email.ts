import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send a transactional email via the send-email Edge Function.
 * Falls back gracefully if the function is not deployed.
 */
export async function sendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: params,
  });

  if (error) {
    console.warn("Email send failed (Edge Function may not be deployed):", error.message);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export function staffInvitationEmail(inviteeName: string, role: string, inviteUrl: string) {
  return {
    subject: `You've been invited to join House Harmony`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to House Harmony</h2>
        <p>Hi ${inviteeName},</p>
        <p>You've been invited to join House Harmony as a <strong>${role}</strong>.</p>
        <p>Click the button below to set up your account:</p>
        <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Accept Invitation
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
    type: "staff_invitation" as const,
  };
}

export function paymentReminderEmail(residentName: string, amount: string, dueDate: string) {
  return {
    subject: `Payment Reminder: ${amount} due ${dueDate}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Payment Reminder</h2>
        <p>Hi ${residentName},</p>
        <p>This is a reminder that a payment of <strong>${amount}</strong> is due on <strong>${dueDate}</strong>.</p>
        <p>Please ensure your payment is submitted on time to avoid any late fees.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          If you've already made this payment, please disregard this notice.
        </p>
      </div>
    `,
    type: "payment_reminder" as const,
  };
}

export function incidentAlertEmail(incidentType: string, severity: string, houseName: string, description: string) {
  const severityColor = severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#2563eb";
  return {
    subject: `[${severity.toUpperCase()}] Incident: ${incidentType} at ${houseName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Incident Report</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Type</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${incidentType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Severity</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">
              <span style="background: ${severityColor}; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 13px;">${severity}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">House</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${houseName}</td>
          </tr>
        </table>
        <p>${description}</p>
        <p style="color: #666; font-size: 14px;">Log in to House Harmony for full details and to update the incident status.</p>
      </div>
    `,
    type: "incident_alert" as const,
  };
}

export function intakeLeadEmail(leadName: string, phone: string, referralSource: string) {
  return {
    subject: `New Intake Lead: ${leadName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Intake Inquiry</h2>
        <p>A new intake lead has been submitted:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Name</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${leadName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Phone</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${phone || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">Referral Source</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${referralSource || "Unknown"}</td>
          </tr>
        </table>
        <p>Log in to House Harmony to review and process this lead.</p>
      </div>
    `,
    type: "intake_lead" as const,
  };
}
