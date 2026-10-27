import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Users, Globe, RefreshCw, Activity } from "lucide-react";

interface PageView {
  id: string;
  path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country: string | null;
  city: string | null;
  session_id: string | null;
  user_id: string | null;
  created_at: string;
}

const AnalyticsDashboard = () => {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViews = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("page_views")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    setViews((data as PageView[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchViews();
    const interval = setInterval(fetchViews, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const inLast = (ms: number) => views.filter((v) => now - new Date(v.created_at).getTime() < ms);
  const today = inLast(24 * 60 * 60 * 1000);
  const last7d = inLast(7 * 24 * 60 * 60 * 1000);
  const live5min = inLast(5 * 60 * 1000);
  const uniqueVisitors = new Set(views.map((v) => v.session_id).filter(Boolean)).size;

  const topPages = countBy(views, (v) => v.path).slice(0, 10);
  const topReferrers = countBy(
    views.filter((v) => v.referrer && !v.referrer.includes("ezyourlife")),
    (v) => extractDomain(v.referrer!)
  ).slice(0, 10);
  const geoBreakdown = countBy(views.filter((v) => v.country), (v) => v.country!).slice(0, 15);
  const utmCampaigns = countBy(views.filter((v) => v.utm_campaign), (v) => v.utm_campaign!).slice(0, 10);
  const utmSources = countBy(views.filter((v) => v.utm_source), (v) => v.utm_source!).slice(0, 10);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Live Analytics (last 30 days)</h2>
        <Button variant="outline" size="sm" onClick={fetchViews}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Activity} label="Live (5 min)" value={live5min.length} highlight />
        <StatCard icon={Eye} label="Today" value={today.length} />
        <StatCard icon={Eye} label="Last 7 days" value={last7d.length} />
        <StatCard icon={Eye} label="Total (30d)" value={views.length} />
        <StatCard icon={Users} label="Unique visitors" value={uniqueVisitors} />
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <CollapsibleCard title="Top Pages">
          <Table>
            <TableHeader><TableRow><TableHead>Path</TableHead><TableHead className="text-right">Views</TableHead></TableRow></TableHeader>
            <TableBody>
              {topPages.map(([path, count]) => (
                <TableRow key={path}>
                  <TableCell className="text-sm font-mono">{path}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline">{count}</Badge></TableCell>
                </TableRow>
              ))}
              {topPages.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CollapsibleCard>

        <CollapsibleCard title="Top Referrers">
          <Table>
            <TableHeader><TableRow><TableHead>Source</TableHead><TableHead className="text-right">Visits</TableHead></TableRow></TableHeader>
            <TableBody>
              {topReferrers.map(([ref, count]) => (
                <TableRow key={ref}>
                  <TableCell className="text-sm">{ref}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline">{count}</Badge></TableCell>
                </TableRow>
              ))}
              {topReferrers.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">Direct traffic only</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CollapsibleCard>

        <CollapsibleCard title={<><Globe className="h-4 w-4" /> Geo Breakdown</>}>
          <Table>
            <TableHeader><TableRow><TableHead>Country</TableHead><TableHead className="text-right">Visits</TableHead></TableRow></TableHeader>
            <TableBody>
              {geoBreakdown.map(([country, count]) => (
                <TableRow key={country}>
                  <TableCell className="text-sm">{country}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline">{count}</Badge></TableCell>
                </TableRow>
              ))}
              {geoBreakdown.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No geo data yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CollapsibleCard>

        <CollapsibleCard title="UTM Campaigns">
          <Table>
            <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Source</TableHead><TableHead className="text-right">Clicks</TableHead></TableRow></TableHeader>
            <TableBody>
              {utmCampaigns.map(([camp, count]) => (
                <TableRow key={camp}>
                  <TableCell className="text-sm font-medium">{camp}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {utmSources.find(([s]) => views.some((v) => v.utm_campaign === camp && v.utm_source === s))?.[0] || "—"}
                  </TableCell>
                  <TableCell className="text-right"><Badge variant="outline">{count}</Badge></TableCell>
                </TableRow>
              ))}
              {utmCampaigns.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No UTM traffic yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CollapsibleCard>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, highlight }: { icon: typeof Eye; label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`h-7 w-7 ${highlight ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function countBy<T>(arr: T[], key: (x: T) => string): [string, number][] {
  const map = new Map<string, number>();
  for (const item of arr) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default AnalyticsDashboard;
