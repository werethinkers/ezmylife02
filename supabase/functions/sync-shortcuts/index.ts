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

    // POST = add shortcut, DELETE = remove shortcut, PUT = edit shortcut, GET = fetch all
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

    if (req.method === "PUT") {
      const body = await req.json();
      const { oldKey, newKey, newValue } = body;
      if (!oldKey || !newKey || !newValue) {
        return new Response(JSON.stringify({ error: "oldKey, newKey, and newValue required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let edited = false;

      // Try editing in promptmaster_sessions favourites first
      const { data: promptSession } = await supabase
        .from("promptmaster_sessions")
        .select("session_data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (promptSession?.session_data) {
        const sd = promptSession.session_data as Record<string, unknown>;
        const favs = sd.favourites as Array<{
          id?: string;
          shortcut?: string;
          prompt?: string;
          title?: string;
          createdAt?: string;
        }>;
        if (Array.isArray(favs)) {
          const favIndex = favs.findIndex(
            (f) => f.shortcut?.toLowerCase() === oldKey.toLowerCase()
          );
          if (favIndex !== -1) {
            favs[favIndex].shortcut = newKey;
            favs[favIndex].prompt = newValue;
            favs[favIndex].title = newValue.slice(0, 40) + (newValue.length > 40 ? "..." : "");
            sd.favourites = favs;
            await supabase.from("promptmaster_sessions").upsert(
              [{ user_id: user.id, session_data: sd }],
              { onConflict: "user_id" }
            );
            edited = true;
          }
        }
      }

      // Also try editing in notebook_sessions
      const { data: notebookSession } = await supabase
        .from("notebook_sessions")
        .select("session_shortcuts")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentShortcuts = Array.isArray(notebookSession?.session_shortcuts)
        ? (notebookSession.session_shortcuts as Array<{ key: string; value: string; category: string }>)
        : [];

      const idx = currentShortcuts.findIndex(
        (s) => s.key?.toLowerCase() === oldKey.toLowerCase()
      );
      if (idx !== -1) {
        currentShortcuts[idx].key = newKey;
        currentShortcuts[idx].value = newValue;
        await supabase.from("notebook_sessions").upsert(
          [{ user_id: user.id, session_shortcuts: currentShortcuts }],
          { onConflict: "user_id" }
        );
        edited = true;
      }

      if (!edited) {
        // If not found in either, add as new to notebook_sessions
        currentShortcuts.push({ key: newKey, value: newValue, category: "Extension" });
        await supabase.from("notebook_sessions").upsert(
          [{ user_id: user.id, session_shortcuts: currentShortcuts }],
          { onConflict: "user_id" }
        );
      }

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

      // Delete from notebook_sessions
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

      // Also delete from promptmaster_sessions favourites if exists
      const { data: promptSession } = await supabase
        .from("promptmaster_sessions")
        .select("session_data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (promptSession?.session_data) {
        const sd = promptSession.session_data as Record<string, unknown>;
        const favs = sd.favourites as Array<{ shortcut?: string }>;
        if (Array.isArray(favs)) {
          const filteredFavs = favs.filter(
            (f) => f.shortcut?.toLowerCase() !== key.toLowerCase()
          );
          if (filteredFavs.length !== favs.length) {
            sd.favourites = filteredFavs;
            await supabase.from("promptmaster_sessions").upsert(
              [{ user_id: user.id, session_data: sd }],
              { onConflict: "user_id" }
            );
          }
        }
      }

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
