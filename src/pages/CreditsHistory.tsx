import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import {
  fetchTransactionHistory,
  reasonLabel,
  entriesToCSV,
  type EnrichedEntry,
} from "@/lib/transactionHistory";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  ExternalLink,
  Gift,
  Loader2,
  ReceiptText,
  Wrench,
  Zap,
} from "lucide-react";

type RangeKey = "7" | "30" | "90" | "all";

const Range: Record<RangeKey, number | null> = { "7": 7, "30": 30, "90": 90, all: null };

const StatusBadge = ({ status }: { status: string }) => {
  const variant =
    status === "succeeded" ? "default" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
};

const Delta = ({ n }: { n: number }) => (
  <span
    className={`tabular-nums font-medium ${n > 0 ? "text-green-500" : n < 0 ? "text-red-500" : "text-muted-foreground"}`}
  >
    {n > 0 ? `+${n}` : n}
  </span>
);

const OutputLink = ({ entry }: { entry: EnrichedEntry }) => {
  if (entry.bulkJob) {
    return (
      <Link to={`/bulk/jobs/${entry.bulkJob.id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
        Bulk job ({entry.bulkJob.completed_items}/{entry.bulkJob.total_items}) <ExternalLink className="h-3 w-3" />
      </Link>
    );
  }
  if (entry.creation?.result_url) {
    return (
      <a href={entry.creation.result_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
        {entry.creation.title || "View output"} <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  if (entry.toolRun?.error) {
    return <span className="text-xs text-destructive">Error: {entry.toolRun.error.slice(0, 60)}</span>;
  }
  return <span className="text-xs text-muted-foreground">—</span>;
};

const ReasonIcon = ({ reason }: { reason: string }) => {
  if (reason === "purchase") return <ReceiptText className="h-4 w-4 text-primary" />;
  if (reason === "tool_run") return <Wrench className="h-4 w-4 text-muted-foreground" />;
  if (reason.includes("bonus") || reason === "monthly_reset" || reason === "admin_adjust" || reason === "coupon")
    return <Gift className="h-4 w-4 text-amber-500" />;
  return <Zap className="h-4 w-4 text-muted-foreground" />;
};

const CreditsHistory = () => {
  const { user } = useAuth();
  const { total } = useWallet();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<EnrichedEntry[]>([]);
  const [range, setRange] = useState<RangeKey>("30");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchTransactionHistory(user.id)
      .then(({ entries }) => setEntries(entries))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const days = Range[range];
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    return entries.filter((e) => {
      if (cutoff && new Date(e.ledger.created_at).getTime() < cutoff) return false;
      if (typeFilter === "all") return true;
      if (typeFilter === "purchase") return e.ledger.reason === "purchase";
      if (typeFilter === "tool") return e.ledger.reason === "tool_run";
      if (typeFilter === "bonus")
        return ["signup_bonus", "first_action_bonus", "monthly_reset", "coupon"].includes(e.ledger.reason);
      if (typeFilter === "admin") return e.ledger.reason === "admin_adjust";
      return true;
    });
  }, [entries, range, typeFilter]);

  // Running balance: walk forward from oldest to compute, then attach.
  const withBalance = useMemo(() => {
    const out = [...filtered];
    let bal = total ?? 0;
    for (let i = 0; i < out.length; i++) {
      out[i] = { ...out[i], runningBalance: bal };
      bal -= out[i].ledger.delta;
    }
    return out;
  }, [filtered, total]);

  const purchases = useMemo(
    () => entries.filter((e) => e.purchase),
    [entries],
  );
  const toolRuns = useMemo(
    () => entries.filter((e) => e.toolRun),
    [entries],
  );

  const downloadCSV = () => {
    const csv = entriesToCSV(withBalance);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEOHead
        title="Transaction history — EZYOURLIFE"
        description="See every credit you've earned, bought, and spent. Includes per-tool usage and outputs."
        path="/credits/history"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction history</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Credits bought, earned, and spent — with the tool used and its output.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/credits"><Zap className="h-4 w-4 mr-2" />Buy credits</Link>
            </Button>
            <Button variant="outline" onClick={downloadCSV} disabled={!withBalance.length}>
              <Download className="h-4 w-4 mr-2" />CSV
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-primary/20 bg-sand/50">
          <CardContent className="p-5 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current balance</p>
              <p className="text-2xl font-semibold tabular-nums flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-primary" /> {total ?? 0}
              </p>
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="tool">Tool usage</SelectItem>
                  <SelectItem value="bonus">Bonuses</SelectItem>
                  <SelectItem value="admin">Admin grants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center p-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All activity</TabsTrigger>
              <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
              <TabsTrigger value="usage">Tool usage ({toolRuns.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withBalance.map((e) => (
                        <TableRow key={e.ledger.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(e.ledger.created_at), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ReasonIcon reason={e.ledger.reason} />
                              <div>
                                <div className="text-sm font-medium">
                                  {e.ledger.reason === "tool_run" && e.toolName
                                    ? e.toolName
                                    : e.ledger.reason === "purchase" && e.purchase
                                      ? `Bought ${e.purchase.credits} credits`
                                      : reasonLabel(e.ledger.reason)}
                                </div>
                                {e.ledger.reason === "tool_run" && e.toolRoute && (
                                  <Link to={e.toolRoute} className="text-xs text-muted-foreground hover:text-primary">
                                    Open tool →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {e.purchase && (
                              <>Pack <code className="text-foreground">{e.purchase.pack_id}</code> · ₹{e.purchase.inr_amount}</>
                            )}
                            {e.toolRun && (
                              <div className="flex items-center gap-2">
                                <StatusBadge status={e.toolRun.status} />
                                <OutputLink entry={e} />
                              </div>
                            )}
                            {e.ledger.reason === "admin_adjust" && (e.ledger.metadata?.note as string) && (
                              <span>Note: {String(e.ledger.metadata.note)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right"><Delta n={e.ledger.delta} /></TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {e.runningBalance ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!withBalance.length && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          No transactions in this range yet.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases" className="mt-4">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pack</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((e) => (
                      <TableRow key={e.purchase!.id}>
                        <TableCell className="text-xs">{format(new Date(e.purchase!.paid_at || e.purchase!.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                        <TableCell><code className="text-xs">{e.purchase!.pack_id}</code></TableCell>
                        <TableCell className="text-right tabular-nums">₹{e.purchase!.inr_amount}</TableCell>
                        <TableCell className="text-right tabular-nums"><ArrowUpCircle className="h-3.5 w-3.5 inline mr-1 text-green-500" />{e.purchase!.credits}</TableCell>
                        <TableCell><Badge variant={e.purchase!.status === "paid" ? "default" : "secondary"}>{e.purchase!.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{e.purchase!.razorpay_payment_id || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {!purchases.length && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No purchases yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="usage" className="mt-4">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tool</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead>Output</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolRuns.map((e) => (
                      <TableRow key={e.toolRun!.id}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(e.toolRun!.started_at), "MMM d, HH:mm")}</TableCell>
                        <TableCell>
                          {e.toolRoute ? (
                            <Link to={e.toolRoute} className="text-sm font-medium hover:text-primary">
                              {e.toolName || e.toolRun!.tool_id}
                            </Link>
                          ) : (
                            <span className="text-sm">{e.toolName || e.toolRun!.tool_id}</span>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={e.toolRun!.status} /></TableCell>
                        <TableCell className="text-right tabular-nums">
                          <ArrowDownCircle className="h-3.5 w-3.5 inline mr-1 text-red-500" />{e.toolRun!.credits_charged}
                        </TableCell>
                        <TableCell><OutputLink entry={e} /></TableCell>
                      </TableRow>
                    ))}
                    {!toolRuns.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No tool runs yet.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  );
};

export default CreditsHistory;
