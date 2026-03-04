// Supabase Edge Function: Send Transactional Email
//
// Required Secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY     - API key from resend.com (or substitute with SendGrid/Postmark)
//   EMAIL_FROM         - Sender address, e.g. "House Harmony <noreply@yourdomain.com>"
//   SUPABASE_URL       - Auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - Auto-provided by Supabase
//
// Usage: supabase.functions.invoke("send-email", { body: { to, subject, html, type } })
//
// Supported types:
//   - staff_invitation:  Invites a new staff member with a magic link
//   - payment_reminder:  Notifies a resident of an upcoming or overdue payment
//   - incident_alert:    Alerts house managers of a new high-severity incident
//   - intake_lead:       Notifies staff of a new intake inquiry

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("EMAIL_FROM") || "House Harmony <noreply@househarmony.app>";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY secret must be configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: EmailRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { to, subject, html, type, metadata } = body;

  if (!to || !subject || !html) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Send via Resend API
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    return new Response(
      JSON.stringify({ error: `Email send failed: ${err}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const result = await emailRes.json();

  // Log the email send to the audit table
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("audit_log").insert({
      action: "EMAIL_SENT",
      entity_type: type || "email",
      entity_id: result.id || null,
      new_value: { to, subject, type, metadata },
    });
  } catch {
    // Audit logging should not block email delivery
  }

  return new Response(
    JSON.stringify({ success: true, id: result.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
