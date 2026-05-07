import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  source?: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const name = (body.name ?? "").trim().slice(0, 120);
    const email = (body.email ?? "").trim().toLowerCase().slice(0, 200);
    const phone = (body.phone ?? "").trim().slice(0, 40);
    const description = (body.description ?? "").trim().slice(0, 2000);
    const source = (body.source ?? "smart-assistant").slice(0, 60);

    if (!name || !email || !description || !isEmail(email)) {
      return new Response(
        JSON.stringify({ error: "name, valid email, and description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const desc = phone ? `${description}\n\n[Phone: ${phone}]\n[Source: ${source}]` : `${description}\n\n[Source: ${source}]`;

    const { data, error } = await supabase
      .from("tool_requests")
      .insert({ name, email, tool_description: desc })
      .select("id")
      .single();

    if (error) {
      console.error("insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-effort activity log + transactional email (won't block response)
    try {
      await supabase.from("activity_logs").insert({
        action_type: "tool_request_submitted",
        action_details: { request_id: data.id, name, email, source },
      });
    } catch (_) { /* ignore */ }

    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "tool-request-received",
          recipientEmail: email,
          idempotencyKey: `tool-request-${data.id}`,
          templateData: { name, description },
        },
      });
    } catch (e) {
      console.warn("transactional email skipped (likely not configured yet)", e);
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-tool-request error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
