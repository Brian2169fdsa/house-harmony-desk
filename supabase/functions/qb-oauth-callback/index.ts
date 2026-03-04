// Supabase Edge Function: QuickBooks OAuth2 Callback
//
// Required Secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   QB_CLIENT_ID       - QuickBooks OAuth2 client ID
//   QB_CLIENT_SECRET   - QuickBooks OAuth2 client secret
//   QB_REDIRECT_URI    - Must match the redirect URI registered with Intuit
//   SUPABASE_URL       - Auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - Auto-provided by Supabase
//
// Flow: Intuit redirects here with ?code=...&realmId=...&state=...
// This function exchanges the code for tokens and stores them in qb_connections.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");

  if (!code || !realmId) {
    return new Response("Missing code or realmId", { status: 400 });
  }

  const clientId = Deno.env.get("QB_CLIENT_ID")!;
  const clientSecret = Deno.env.get("QB_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("QB_REDIRECT_URI")!;

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return new Response(`Token exchange failed: ${err}`, { status: 500 });
  }

  const tokens = await tokenRes.json();

  // Store connection in database
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get requesting user from the state or auth header
  // In production, validate the state parameter against a stored value

  const { error } = await supabase.from("qb_connections").upsert({
    realm_id: realmId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    status: "active",
    last_refreshed_at: new Date().toISOString(),
  }, { onConflict: "realm_id" });

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  // Redirect user back to the QuickBooks page
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8081";
  return new Response(null, {
    status: 302,
    headers: { Location: `${appUrl}/quickbooks?connected=true` },
  });
});
