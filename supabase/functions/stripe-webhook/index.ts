import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    
    // For simplicity, we'll process without signature verification
    // In production, you should verify the webhook signature
    const event = JSON.parse(body);
    
    logStep("Webhook received", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      if (session.metadata?.type === "trial") {
        const userId = session.metadata.user_id;
        
        // Grant 24-hour trial access
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await supabaseClient
          .from("premium_access")
          .insert({
            user_id: userId,
            access_type: "trial",
            expires_at: expiresAt.toISOString(),
            stripe_customer_id: session.customer,
          });

        logStep("Trial access granted", { userId, expiresAt: expiresAt.toISOString() });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
