import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch notebook shortcuts
    const { data: notebookSession } = await supabase
      .from("notebook_sessions")
      .select("session_shortcuts")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch promptmaster favourites
    const { data: promptSession } = await supabase
      .from("promptmaster_sessions")
      .select("session_data")
      .eq("user_id", user.id)
      .maybeSingle();

    const shortcuts: Record<string, string> = {};

    // Parse notebook shortcuts
    if (notebookSession?.session_shortcuts) {
      const ns = notebookSession.session_shortcuts as Record<string, unknown>[];
      if (Array.isArray(ns)) {
        for (const item of ns) {
          const s = item as { key?: string; value?: string };
          if (s.key && s.value) {
            shortcuts[s.key] = s.value;
          }
        }
      }
    }

    // Parse promptmaster favourites (shortcut -> prompt)
    if (promptSession?.session_data) {
      const sd = promptSession.session_data as Record<string, unknown>;
      const favs = sd.favourites as Array<{
        shortcut?: string;
        prompt?: string;
        title?: string;
      }>;
      if (Array.isArray(favs)) {
        for (const f of favs) {
          if (f.shortcut && f.prompt) {
            shortcuts[f.shortcut] = f.prompt;
          }
        }
      }
    }

    return new Response(JSON.stringify({ shortcuts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
