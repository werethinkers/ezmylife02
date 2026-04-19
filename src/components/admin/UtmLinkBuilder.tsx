import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

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

const UtmLinkBuilder = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<UtmLink[]>([]);
  const [campaignCounts, setCampaignCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ label: "", target_path: "/", utm_source: "", utm_medium: "", utm_campaign: "" });
  const [loading, setLoading] = useState(false);

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

  const buildUrl = (l: { target_path: string; utm_source: string; utm_medium: string; utm_campaign: string }) => {
    const path = l.target_path.startsWith("/") ? l.target_path : `/${l.target_path}`;
    const params = new URLSearchParams({
      utm_source: l.utm_source,
      utm_medium: l.utm_medium,
      utm_campaign: l.utm_campaign,
    });
    return `${BASE}${path}?${params.toString()}`;
  };

  const handleCreate = async () => {
    if (!form.label || !form.utm_source || !form.utm_medium || !form.utm_campaign) {
      toast.error("Fill in label, source, medium, and campaign");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("utm_links").insert({
      label: form.label,
      target_path: form.target_path || "/",
      utm_source: form.utm_source,
      utm_medium: form.utm_medium,
      utm_campaign: form.utm_campaign,
      created_by: user?.id ?? null,
    } as never);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("UTM link created");
      setForm({ label: "", target_path: "/", utm_source: "", utm_medium: "", utm_campaign: "" });
      fetchAll();
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
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Create UTM Link</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Label (internal)</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Twitter Launch Campaign" />
            </div>
            <div className="space-y-1.5">
              <Label>Target path</Label>
              <Input value={form.target_path} onChange={(e) => setForm({ ...form, target_path: e.target.value })} placeholder="/tools" />
            </div>
            <div className="space-y-1.5">
              <Label>utm_source</Label>
              <Input value={form.utm_source} onChange={(e) => setForm({ ...form, utm_source: e.target.value })} placeholder="twitter" />
            </div>
            <div className="space-y-1.5">
              <Label>utm_medium</Label>
              <Input value={form.utm_medium} onChange={(e) => setForm({ ...form, utm_medium: e.target.value })} placeholder="social" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>utm_campaign</Label>
              <Input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} placeholder="launch_2026" />
            </div>
          </div>
          {form.utm_source && form.utm_medium && form.utm_campaign && (
            <div className="p-3 bg-muted/50 rounded-md border break-all text-xs font-mono">
              {buildUrl(form)}
            </div>
          )}
          <Button onClick={handleCreate} disabled={loading}>Create Link</Button>
        </CardContent>
      </Card>

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
                const url = buildUrl(l);
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
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No UTM links yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtmLinkBuilder;
