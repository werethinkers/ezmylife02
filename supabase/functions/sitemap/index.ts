// Dynamic sitemap.xml generated from live tools_catalog
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE = "https://ezyourlife.com";

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/ai-apps", priority: "0.98", changefreq: "daily" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/subscription", priority: "0.85", changefreq: "weekly" },
  { path: "/refund-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/auth", priority: "0.4", changefreq: "monthly" },
  { path: "/get-extension", priority: "0.65", changefreq: "monthly" },
  { path: "/startup-analyser", priority: "0.85", changefreq: "weekly" },
  { path: "/notebook", priority: "0.8", changefreq: "weekly" },
  { path: "/promptmaster", priority: "0.8", changefreq: "weekly" },
  { path: "/meet-nudge", priority: "0.75", changefreq: "weekly" },
  { path: "/mobile-shortcuts", priority: "0.6", changefreq: "monthly" },
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch live tools (include drafts? no — only live, indexable)
  const { data: tools } = await supabase
    .from("tools_catalog")
    .select("id, updated_at, is_live")
    .eq("is_live", true)
    .order("display_order", { ascending: true })
    .limit(5000);

  const urls: string[] = [];

  for (const r of STATIC_ROUTES) {
    urls.push(
      `<url><loc>${SITE}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    );
  }

  for (const t of tools ?? []) {
    const lastmod = t.updated_at ? new Date(t.updated_at).toISOString().slice(0, 10) : today;
    const id = escapeXml(t.id);
    urls.push(
      `<url><loc>${SITE}/tool-preview/${id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      `<url><loc>${SITE}/tool/${id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.65</priority></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
