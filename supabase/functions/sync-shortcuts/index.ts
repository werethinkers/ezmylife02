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

    // POST = add shortcut, DELETE = remove shortcut, GET = fetch all
    if (req.method === "POST") {
      const body = await req.json();
      const { key, value, category } = body;
      if (!key || !value) {
        return new Response(JSON.stringify({ error: "key and value required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add to notebook_sessions
      const { data: existing } = await supabase
        .from("notebook_sessions")
        .select("session_shortcuts")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentShortcuts = Array.isArray(existing?.session_shortcuts)
        ? (existing.session_shortcuts as Array<{ key: string; value: string; category: string }>)
        : [];

      // Remove duplicate if exists
      const filtered = currentShortcuts.filter(
        (s) => s.key?.toLowerCase() !== key.toLowerCase()
      );
      filtered.push({ key, value, category: category || "Extension" });

      await supabase.from("notebook_sessions").upsert(
        [{ user_id: user.id, session_shortcuts: filtered }],
        { onConflict: "user_id" }
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const body = await req.json();
      const { key } = body;
      if (!key) {
        return new Response(JSON.stringify({ error: "key required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("notebook_sessions")
        .select("session_shortcuts")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentShortcuts = Array.isArray(existing?.session_shortcuts)
        ? (existing.session_shortcuts as Array<{ key: string; value: string; category: string }>)
        : [];

      const filtered = currentShortcuts.filter(
        (s) => s.key?.toLowerCase() !== key.toLowerCase()
      );

      await supabase.from("notebook_sessions").upsert(
        [{ user_id: user.id, session_shortcuts: filtered }],
        { onConflict: "user_id" }
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - fetch all shortcuts
    const { data: notebookSession } = await supabase
      .from("notebook_sessions")
      .select("session_shortcuts")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: promptSession } = await supabase
      .from("promptmaster_sessions")
      .select("session_data")
      .eq("user_id", user.id)
      .maybeSingle();

    const shortcuts: Record<string, string> = {};

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

    if (promptSession?.session_data) {
      const sd = promptSession.session_data as Record<string, unknown>;
      const favs = sd.favourites as Array<{
        shortcut?: string;
        prompt?: string;
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
