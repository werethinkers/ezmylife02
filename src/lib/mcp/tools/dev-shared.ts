import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/*
 * Shared by the developer tools (dev-*.ts). Every call runs as the signed-in developer with
 * their own token, so row-level security limits them to their own apps, and the database
 * functions in supabase/migrations/20261020010000_developer_apps.sql enforce the order
 * draft → checks → submitted → approved. No tool can set a price, a share, approve or publish.
 */

export const SITE = "https://ezyourlife.com";

export function devClient(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const text = (t: string, structured?: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: t }],
  ...(structured ? { structuredContent: structured } : {}),
});

export const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true });

export const notSignedIn = () => fail("Not signed in to EzYourLife. Reconnect the connector and sign in.");

export const VERSION_FIELDS =
  "id, version_no, status, name, short_description, description, category, tool_types, support_email, release_notes, charge_options, qa, qa_passed, qa_at, submitted_at, reviewed_at, review_notes, updated_at";

/** The newest version of an app the signed-in developer owns, or null. */
export async function latestVersion(sb: ReturnType<typeof devClient>, appId: string) {
  const { data, error } = await sb
    .from("dev_app_versions")
    .select(VERSION_FIELDS)
    .eq("app_id", appId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as null | {
    id: string;
    version_no: number;
    status: string;
    name: string;
    qa: { checks: { label: string; status: string; detail: string }[]; passed: boolean } | null;
    qa_passed: boolean;
    review_notes: string | null;
  };
}

/** Database errors carry the plain sentence raised by the function; drop Postgres prefixes. */
export const dbMessage = (m: string) =>
  /does not exist|could not find the function|schema cache/i.test(m)
    ? "The developer-apps database update is not applied on EzYourLife yet. Ask the EzYourLife team to apply it."
    : m.replace(/^ERROR:\s*/i, "");
