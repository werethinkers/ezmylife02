import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Footprints, ChevronDown, ChevronRight, Globe, Monitor, Smartphone, Tablet, AlertCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Fragment } from "react";
import { toast } from "sonner";

interface VisitorSession {
  session_id: string;
  ip_hash: string | null;
  ip_address: string | null;
  user_id: string | null;
  user_email: string | null;
  first_seen: string;
  last_seen: string;
  duration_seconds: number;
  page_count: number;
  is_bounce: boolean;
  entry_path: string | null;
  exit_path: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface PageStep {
  id: string;
  path: string;
  created_at: string;
  time_on_page_ms: number | null;
  referrer: string | null;
}

const RANGE_OPTIONS: { label: string; hours: number }[] = [
  { label: "Last 1 hour", hours: 1 },
  { label: "Last 24 hours", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "Last 30 days", hours: 24 * 30 },
];

const DeviceIcon = ({ d }: { d: string | null }) => {
  if (d === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (d === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
};

const VisitorsTracker = () => {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeHours, setRangeHours] = useState(24);
  const [audience, setAudience] = useState<"all" | "registered" | "anonymous">("all");
  const [bouncedOnly, setBouncedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, PageStep[]>>({});

  const fetchSessions = async () => {
    setLoading(true);
    const since = new Date(Date.now() - rangeHours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.rpc("get_visitor_sessions", { _since: since, _limit: 1000 });
    if (!error && data) setSessions(data as VisitorSession[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    const t = setInterval(fetchSessions, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeHours]);

  const toggleExpand = async (sid: string) => {
    if (expanded === sid) { setExpanded(null); return; }
    setExpanded(sid);
    if (!steps[sid]) {
      const { data } = await supabase
        .from("page_views")
        .select("id, path, created_at, time_on_page_ms, referrer")
        .eq("session_id", sid)
        .order("created_at", { ascending: true })
        .limit(200);
      setSteps((s) => ({ ...s, [sid]: (data as PageStep[]) ?? [] }));
    }
  };

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (audience === "registered" && !s.user_id) return false;
      if (audience === "anonymous" && s.user_id) return false;
      if (bouncedOnly && !s.is_bounce) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [s.user_email, s.ip_address, s.entry_path, s.exit_path, s.country, s.city, s.referrer]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, audience, bouncedOnly, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const uniqueIps = new Set(filtered.map((s) => s.ip_hash).filter(Boolean)).size;
    const bounced = filtered.filter((s) => s.is_bounce).length;
    const avgPages = total ? (filtered.reduce((a, s) => a + Number(s.page_count), 0) / total).toFixed(1) : "0";
    const bounceRate = total ? Math.round((bounced / total) * 100) : 0;
    const registered = filtered.filter((s) => s.user_id).length;
    return { total, uniqueIps, bounceRate, avgPages, registered };
  }, [filtered]);

  const fmtDuration = (sec: number) => {
    if (!sec || sec < 1) return "—";
    if (sec < 60) return `${Math.round(sec)}s`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Footprints className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Visitor tracking</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(rangeHours)} onValueChange={(v) => setRangeHours(Number(v))}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => <SelectItem key={o.hours} value={String(o.hours)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visitors</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="anonymous">Anonymous</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={bouncedOnly ? "default" : "outline"} size="sm" onClick={() => setBouncedOnly((b) => !b)}>
            Bounced only
          </Button>
          <Input
            placeholder="Search IP, email, path…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[240px]"
          />
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Sessions" value={stats.total} />
        <Stat label="Unique IPs" value={stats.uniqueIps} />
        <Stat label="Registered" value={stats.registered} />
        <Stat label="Avg pages / session" value={stats.avgPages} />
        <Stat label="Bounce rate" value={`${stats.bounceRate}%`} highlight={stats.bounceRate > 60} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Sessions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Visitor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Entered → Exited</TableHead>
                  <TableHead className="text-right">Pages</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No visitors in this range</TableCell></TableRow>
                )}
                {filtered.map((s) => (
                  <>
                    <TableRow key={s.session_id} className="cursor-pointer hover:bg-muted/40" onClick={() => toggleExpand(s.session_id)}>
                      <TableCell>{expanded === s.session_id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {s.user_email ?? <span className="text-muted-foreground">Anonymous</span>}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{s.ip_address ?? s.ip_hash?.slice(0, 10) ?? "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.city ? `${s.city}, ` : ""}{s.country ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <DeviceIcon d={s.device_type} />
                          {s.browser ?? "?"} · {s.os ?? "?"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono truncate max-w-[260px]">
                          <span className="text-primary">{s.entry_path ?? "—"}</span>
                          {" → "}
                          <span className={s.is_bounce ? "text-destructive" : ""}>{s.exit_path ?? "—"}</span>
                        </div>
                        {s.is_bounce && <Badge variant="destructive" className="mt-1 text-[10px]">Bounce</Badge>}
                      </TableCell>
                      <TableCell className="text-right"><Badge variant="outline">{s.page_count}</Badge></TableCell>
                      <TableCell className="text-right text-sm">{fmtDuration(Number(s.duration_seconds))}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {s.utm_source ? <Badge variant="secondary" className="mr-1">{s.utm_source}</Badge> : null}
                          {s.referrer ? new URL(s.referrer).hostname.replace(/^www\./, "") : "Direct"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground" title={format(new Date(s.last_seen), "PPpp")}>
                        {formatDistanceToNow(new Date(s.last_seen), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                    {expanded === s.session_id && (
                      <TableRow key={s.session_id + "-exp"} className="bg-muted/20">
                        <TableCell colSpan={9} className="p-4">
                          <div className="text-xs font-semibold mb-2 text-muted-foreground">CLICK PATH</div>
                          {!steps[s.session_id] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ol className="space-y-1.5">
                              {steps[s.session_id].map((p, i) => (
                                <li key={p.id} className="flex items-center gap-3 text-sm">
                                  <span className="text-muted-foreground tabular-nums w-6">{i + 1}.</span>
                                  <span className="font-mono">{p.path}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(p.created_at), "HH:mm:ss")}
                                  </span>
                                  {p.time_on_page_ms ? (
                                    <Badge variant="outline" className="text-[10px]">{Math.round(p.time_on_page_ms / 1000)}s on page</Badge>
                                  ) : null}
                                  {i === steps[s.session_id].length - 1 && s.is_bounce && (
                                    <Badge variant="destructive" className="text-[10px]">Bounced here</Badge>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardContent className="p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default VisitorsTracker;
