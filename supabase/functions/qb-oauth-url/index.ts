// Supabase Edge Function: Generate QuickBooks OAuth2 Authorization URL
//
// Required Secrets (set via Supabase Dashboard → Edge Functions → Secrets):
//   QB_CLIENT_ID       - QuickBooks OAuth2 client ID
//   QB_REDIRECT_URI    - e.g. https://<project>.supabase.co/functions/v1/qb-oauth-callback
//
// Usage: supabase.functions.invoke("qb-oauth-url")
// Returns: { url: "https://appcenter.intuit.com/connect/oauth2?..." }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientId = Deno.env.get("QB_CLIENT_ID");
  const redirectUri = Deno.env.get("QB_REDIRECT_URI");

  if (!clientId || !redirectUri) {
    return new Response(
      JSON.stringify({
        error: "QB_CLIENT_ID and QB_REDIRECT_URI secrets must be configured",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const scope = "com.intuit.quickbooks.accounting";
  const state = crypto.randomUUID();

  const url = new URL("https://appcenter.intuit.com/connect/oauth2");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);

  return new Response(JSON.stringify({ url: url.toString(), state }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
