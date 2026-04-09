import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SIMPLE_WORDS = [
  "ORBIT", "WAVE", "SPARK", "BLAZE", "PEAK", "FLUX", "PULSE", "NEXUS", "GLOW", "DASH",
  "BOLT", "RISE", "NOVA", "EDGE", "LINK", "SYNC", "CORE", "APEX", "HALO", "VIBE",
  "ZOOM", "LEAP", "LOOP", "ZONE", "FUSE", "BEAM", "GRID", "NODE", "CHIP", "CLIX",
  "MINT", "SAGE", "PINE", "REEF", "DUNE", "HAWK", "LYNX", "PUMA", "CROW", "FINN",
  "ECHO", "DOCK", "RAMP", "PIER", "SAIL", "TIDE", "SURF", "COVE", "MESA", "VALE",
];

function generateNudgeId(firstName: string): string {
  const name = firstName.toUpperCase().replace(/[^A-Z]/g, "") || "USER";
  const word = SIMPLE_WORDS[Math.floor(Math.random() * SIMPLE_WORDS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${name}-${word}-${num}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { name, phone, email, occupation, business_name, location, website, linkedin_url, fun_fact, event_id, host_id } = body;

    if (!name || !email || !phone || !occupation) {
      return new Response(JSON.stringify({ error: "name, email, phone, occupation are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = name.split(" ")[0];

    // Check if user already exists by email
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email.toLowerCase().trim());

    let userId: string;
    let nudgeId: string | null = null;
    let isExisting = false;

    if (existingUser) {
      userId = existingUser.id;
      isExisting = true;
      // Get existing nudge_id
      const { data: existingProfile } = await admin.from("meet_nudge_profiles").select("nudge_id").eq("host_id", userId).single();
      nudgeId = existingProfile?.nudge_id || null;
    } else {
      // Create new user with random password
      const randomPassword = crypto.randomUUID() + "Aa1!";
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: randomPassword,
        email_confirm: true,
        user_metadata: { full_name: name, display_name: firstName },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;

      // Update profile (trigger creates it, we update with extra fields)
      await admin.from("profiles").update({
        full_name: name,
        display_name: firstName,
        phone_number: phone,
        company: business_name || null,
        job_title: occupation,
        location: location || null,
        website: website || null,
      }).eq("id", userId);

      // Generate unique nudge_id
      for (let i = 0; i < 10; i++) {
        const candidate = generateNudgeId(firstName);
        const { data: collision } = await admin.from("meet_nudge_profiles").select("nudge_id").eq("nudge_id", candidate).single();
        if (!collision) { nudgeId = candidate; break; }
      }

      if (!nudgeId) {
        nudgeId = `${firstName.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      }

      // Create meet_nudge_profiles entry
      await admin.from("meet_nudge_profiles").insert({
        host_id: userId,
        name,
        occupation,
        business_name: business_name || null,
        business_url: website || null,
        linkedin_url: linkedin_url || null,
        email,
        phone,
        nudge_id: nudgeId,
      });

      // Grant 1-month complimentary premium access
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await admin.from("premium_access").insert({
        user_id: userId,
        access_type: "complimentary",
        expires_at: expiresAt.toISOString(),
      });

      // Auto-create "My Network" event
      const eventSlug = `${firstName.toLowerCase()}-network-${Date.now().toString(36)}`;
      await admin.from("meet_nudge_events").insert({
        host_id: userId,
        name: "My Network",
        slug: eventSlug,
        date: new Date().toISOString().split("T")[0],
      });
    }

    // Insert contact linking guest to host's event
    if (event_id && host_id) {
      await admin.from("meet_nudge_contacts").insert({
        host_id,
        event_id,
        name,
        phone,
        email,
        occupation,
        business_name: business_name || null,
        location: location || null,
        website: website || null,
        linkedin_url: linkedin_url || null,
        fun_fact: fun_fact || null,
        connected_via_host_id: host_id,
      });

      // Reciprocal: add host info to guest's event
      const { data: hostProfile } = await admin.from("meet_nudge_profiles").select("*").eq("host_id", host_id).single();
      if (hostProfile) {
        // Get guest's auto-event
        const { data: guestEvent } = await admin.from("meet_nudge_events")
          .select("id")
          .eq("host_id", userId)
          .order("created_at", { ascending: true })
          .limit(1)
          .single();

        if (guestEvent) {
          await admin.from("meet_nudge_contacts").insert({
            host_id: userId,
            event_id: guestEvent.id,
            name: hostProfile.name,
            phone: hostProfile.phone,
            email: hostProfile.email,
            occupation: hostProfile.occupation,
            business_name: hostProfile.business_name,
            website: hostProfile.business_url,
            linkedin_url: hostProfile.linkedin_url,
            connected_via_host_id: host_id,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      nudge_id: nudgeId,
      user_id: userId,
      is_existing: isExisting,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
