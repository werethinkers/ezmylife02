import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Link as LinkIcon, Wand2, Layers } from "lucide-react";
import { toast } from "sonner";
import { useToolsCatalog } from "@/hooks/useToolsCatalog";

interface UtmLink {
  id: string;
  label: string;
  target_path: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  click_count: number;
  created_at: string;
}

const BASE = "https://ezyourlife.com";

const CHANNELS = [
  { value: "instagram", label: "Instagram" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "tiktok", label: "TikTok" },
  { value: "other", label: "Other" },
];

const PROMO_TYPES = [
  { value: "influencer", label: "Influencer", medium: "influencer" },
  { value: "paid", label: "Paid Ad", medium: "paid" },
  { value: "organic", label: "Organic Post", medium: "social" },
  { value: "newsletter", label: "Newsletter", medium: "email" },
  { value: "partner", label: "Partner", medium: "referral" },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const monthTag = () => {
  const d = new Date();
  return `${d.toLocaleString("en", { month: "short" }).toLowerCase()}${String(d.getFullYear()).slice(-2)}`;
};

const UtmLinkBuilder = () => {
  const { user } = useAuth();
  const { data: catalog = [] } = useToolsCatalog();
  const [links, setLinks] = useState<UtmLink[]>([]);
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Campaign builder state
  const [scope, setScope] = useState<"app" | "tools" | "tool">("app");
  const [toolId, setToolId] = useState<string>("");
  const [channel, setChannel] = useState<string>("instagram");
  const [otherChannel, setOtherChannel] = useState("");
  const [promo, setPromo] = useState<string>("influencer");
  const [influencer, setInfluencer] = useState("");
  const [campaignOverride, setCampaignOverride] = useState("");

  // Bulk influencers
  const [bulkInfluencers, setBulkInfluencers] = useState("");

  const targetPath = useMemo(() => {
    if (scope === "app") return "/";
    if (scope === "tools") return "/tools";
    return toolId ? `/tool/${toolId}` : "/";
  }, [scope, toolId]);

  const utmSource = channel === "other" ? slugify(otherChannel) || "other" : channel;
  const promoCfg = PROMO_TYPES.find((p) => p.value === promo) ?? PROMO_TYPES[0];
  const utmMedium = promoCfg.medium;

  const buildCampaign = (handle?: string) => {
    if (campaignOverride && !handle) return slugify(campaignOverride);
    const parts = [utmSource];
    if (promo === "influencer" && (handle || influencer)) parts.push(slugify(handle || influencer));
    else parts.push(promo);
    if (scope === "tool" && toolId) parts.push(slugify(toolId));
    else if (scope === "tools") parts.push("tools");
    else parts.push("app");
    parts.push(monthTag());
    return parts.join("_");
  };

  const buildUrl = (path: string, source: string, medium: string, campaign: string) => {
    const p = path.startsWith("/") ? path : `/${path}`;
    const params = new URLSearchParams({ utm_source: source, utm_medium: medium, utm_campaign: campaign });
    return `${BASE}${p}?${params.toString()}`;
  };

  const previewCampaign = buildCampaign();
  const previewUrl = buildUrl(targetPath, utmSource, utmMedium, previewCampaign);

  const fetchAll = async () => {
    const [{ data: linksData }, { data: views }] = await Promise.all([
      supabase.from("utm_links").select("*").order("created_at", { ascending: false }),
      supabase.from("page_views").select("utm_campaign").not("utm_campaign", "is", null),
    ]);
    setLinks((linksData as UtmLink[]) ?? []);
    const counts: Record<string, number> = {};
    (views ?? []).forEach((v: { utm_campaign: string | null }) => {
      if (v.utm_campaign) counts[v.utm_campaign] = (counts[v.utm_campaign] ?? 0) + 1;
    });
    setCampaignCounts(counts);
  };

  useEffect(() => { fetchAll(); }, []);

  const insertLink = async (handle: string | null) => {
    const campaign = buildCampaign(handle ?? undefined);
    const labelParts = [
      CHANNELS.find((c) => c.value === channel)?.label ?? channel,
      promoCfg.label,
      handle ? `(${handle})` : "",
      scope === "tool" && toolId ? `→ ${toolId}` : scope === "tools" ? "→ Tools" : "→ Home",
    ].filter(Boolean);
    const label = labelParts.join(" · ");

    const { error } = await supabase.from("utm_links").insert({
      label,
      target_path: targetPath,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: campaign,
      created_by: user?.id ?? null,
    } as never);
    if (error) throw error;
    return buildUrl(targetPath, utmSource, utmMedium, campaign);
  };

  const handleGenerate = async () => {
    if (scope === "tool" && !toolId) { toast.error("Pick a tool"); return; }
    if (channel === "other" && !otherChannel) { toast.error("Name the channel"); return; }
    if (promo === "influencer" && !influencer) { toast.error("Influencer handle required"); return; }
    setLoading(true);
    try {
      const url = await insertLink(promo === "influencer" ? influencer : null);
      navigator.clipboard.writeText(url);
      toast.success("Link generated & copied");
      fetchAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulk = async () => {
    if (scope === "tool" && !toolId) { toast.error("Pick a tool"); return; }
    const handles = bulkInfluencers.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    if (handles.length === 0) { toast.error("Add at least one influencer"); return; }
    setLoading(true);
    try {
      for (const h of handles) await insertLink(h);
      toast.success(`Created ${handles.length} tracked links`);
      setBulkInfluencers("");
      fetchAll();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("utm_links").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAll(); }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Campaign Link Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Promote</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">Whole app (Home)</SelectItem>
                  <SelectItem value="tools">Tools catalog</SelectItem>
                  <SelectItem value="tool">A specific tool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === "tool" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label>Tool</Label>
                <Select value={toolId} onValueChange={setToolId}>
                  <SelectTrigger><SelectValue placeholder="Pick a tool" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {catalog.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {channel === "other" && (
              <div className="space-y-1.5">
                <Label>Channel name</Label>
                <Input value={otherChannel} onChange={(e) => setOtherChannel(e.target.value)} placeholder="reddit, podcast, ..." />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Promotion type</Label>
              <Select value={promo} onValueChange={setPromo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {promo === "influencer" && (
              <div className="space-y-1.5">
                <Label>Influencer handle</Label>
                <Input value={influencer} onChange={(e) => setInfluencer(e.target.value)} placeholder="@john" />
              </div>
            )}
            <div className="space-y-1.5 md:col-span-2">
              <Label>Campaign tag (optional override)</Label>
              <Input value={campaignOverride} onChange={(e) => setCampaignOverride(e.target.value)} placeholder={previewCampaign} />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-md border break-all text-xs font-mono">
            {previewUrl}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerate} disabled={loading}>
              <LinkIcon className="h-4 w-4 mr-1.5" /> Generate & Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {promo === "influencer" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" /> Bulk: One link per influencer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Influencer handles (one per line or comma separated)</Label>
            <Textarea
              rows={4}
              value={bulkInfluencers}
              onChange={(e) => setBulkInfluencers(e.target.value)}
              placeholder="@john&#10;@jane&#10;@creator3"
            />
            <Button onClick={handleBulk} disabled={loading} variant="secondary">
              Generate {bulkInfluencers.split(/[\n,]+/).filter((s) => s.trim()).length || 0} links
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Tracked Links</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((l) => {
                const url = buildUrl(l.target_path, l.utm_source, l.utm_medium, l.utm_campaign);
                const clicks = campaignCounts[l.utm_campaign] ?? 0;
                return (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm font-medium">{l.label}</TableCell>
                    <TableCell className="text-xs"><Badge variant="outline">{l.utm_campaign}</Badge></TableCell>
                    <TableCell className="text-xs font-mono max-w-xs truncate">{url}</TableCell>
                    <TableCell className="text-right"><Badge>{clicks}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => copy(url)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {links.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No tracked links yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtmLinkBuilder;
