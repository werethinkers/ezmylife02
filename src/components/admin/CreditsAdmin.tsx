import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Zap, Search } from "lucide-react";
import { format } from "date-fns";
import { GrantCreditsForm } from "./GrantCreditsForm";

interface Pricing { tool_id: string; cost_inr: number; credit_cost: number }
interface CatalogRow { id: string; name: string }
interface Profile { id: string; email: string | null; display_name: string | null; full_name: string | null }
interface LedgerRow { id: string; user_id: string; delta: number; reason: string; metadata: Record<string, unknown>; created_at: string }
interface PurchaseRow { id: string; user_id: string; pack_id: string; credits: number; inr_amount: number; status: string; paid_at: string | null; created_at: string; razorpay_payment_id: string | null }
interface WalletRow { user_id: string; free_balance: number; paid_balance: number }
interface UserCreditSummary {
  user_id: string;
  email: string;
  name: string;
  free_balance: number;
  paid_balance: number;
  total_credits_bought: number;
  total_inr_spent: number;
  purchase_count: number;
  last_purchase_at: string | null;
  purchases: PurchaseRow[];
}

export const CreditsAdmin = () => {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [catalog, setCatalog] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Grant
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [picked, setPicked] = useState<Profile | null>(null);
  const [grantAmt, setGrantAmt] = useState<number>(50);
  const [grantNote, setGrantNote] = useState("");
  const [granting, setGranting] = useState(false);
  const [recent, setRecent] = useState<LedgerRow[]>([]);

  // User credits & purchases overview
  const [userSummaries, setUserSummaries] = useState<UserCreditSummary[]>([]);
  const [userFilter, setUserFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"spent" | "bought" | "balance" | "recent">("spent");

  const load = async () => {
    setLoading(true);
    const [{ data: pr }, { data: cat }, { data: led }, { data: wallets }, { data: purchases }, { data: profs }] = await Promise.all([
      supabase.from("tool_pricing").select("tool_id, cost_inr, credit_cost").order("tool_id"),
      supabase.from("tools_catalog").select("id, name"),
      supabase.from("credit_ledger").select("*").eq("reason", "admin_adjust").order("created_at", { ascending: false }).limit(20),
      supabase.from("credit_wallets").select("user_id, free_balance, paid_balance"),
      supabase.from("credit_purchases").select("id, user_id, pack_id, credits, inr_amount, status, paid_at, created_at, razorpay_payment_id").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, display_name, full_name"),
    ]);
    setPricing((pr || []) as Pricing[]);
    const map: Record<string, string> = {};
    (cat as CatalogRow[] | null)?.forEach((c) => { map[c.id] = c.name; });
    setCatalog(map);
    setRecent((led || []) as LedgerRow[]);

    // Build per-user summary
    const profMap = new Map<string, Profile>();
    (profs as Profile[] | null)?.forEach((p) => profMap.set(p.id, p));
    const walletMap = new Map<string, WalletRow>();
    (wallets as WalletRow[] | null)?.forEach((w) => walletMap.set(w.user_id, w));
    const byUser = new Map<string, PurchaseRow[]>();
    (purchases as PurchaseRow[] | null)?.forEach((p) => {
      const arr = byUser.get(p.user_id) ?? [];
      arr.push(p);
      byUser.set(p.user_id, arr);
    });
    const userIds = new Set<string>([...walletMap.keys(), ...byUser.keys()]);
    const summaries: UserCreditSummary[] = [];
    userIds.forEach((uid) => {
      const w = walletMap.get(uid);
      const ps = byUser.get(uid) ?? [];
      const paidPs = ps.filter((p) => p.status === "paid");
      const prof = profMap.get(uid);
      summaries.push({
        user_id: uid,
        email: prof?.email ?? "—",
        name: prof?.full_name || prof?.display_name || "—",
        free_balance: w?.free_balance ?? 0,
        paid_balance: w?.paid_balance ?? 0,
        total_credits_bought: paidPs.reduce((s, p) => s + (p.credits || 0), 0),
        total_inr_spent: paidPs.reduce((s, p) => s + (p.inr_amount || 0), 0),
        purchase_count: paidPs.length,
        last_purchase_at: paidPs[0]?.paid_at ?? paidPs[0]?.created_at ?? null,
        purchases: ps,
      });
    });
    setUserSummaries(summaries);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (toolId: string) => {
    const v = edits[toolId];
    if (v == null || v < 1) return;
    setSavingId(toolId);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("admin-tool-pricing", {
      body: { action: "set_credits", tool_id: toolId, credit_cost: v },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setSavingId(null);
    if (error || data?.error) {
      toast({ title: "Failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: `${toolId}: ${v} credits` });
    setEdits((s) => { const n = { ...s }; delete n[toolId]; return n; });
    load();
  };

  const doSearch = async () => {
    if (!search.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, email, display_name, full_name")
      .or(`email.ilike.%${search}%,display_name.ilike.%${search}%,full_name.ilike.%${search}%`)
      .limit(10);
    setResults((data || []) as Profile[]);
  };

  const grant = async () => {
    if (!picked || !grantAmt) return;
    setGranting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("admin-tool-pricing", {
      body: { action: "grant_credits", user_id: picked.id, credits: Number(grantAmt), note: grantNote },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setGranting(false);
    if (error || data?.error) {
      toast({ title: "Failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Granted", description: `${grantAmt} free credits → ${picked.email}` });
    setGrantNote("");
    setPicked(null);
    setSearch("");
    setResults([]);
    load();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Tool credit costs</CardTitle>
          <a href="/admin?tab=bulk-qa" className="text-xs underline text-muted-foreground hover:text-foreground">Open Bulk QA →</a>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="w-32">Credits</TableHead>
                <TableHead className="text-right w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.map((p) => {
                const v = edits[p.tool_id] ?? p.credit_cost;
                const dirty = edits[p.tool_id] != null && edits[p.tool_id] !== p.credit_cost;
                return (
                  <TableRow key={p.tool_id}>
                    <TableCell className="text-sm">{catalog[p.tool_id] || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.tool_id}</TableCell>
                    <TableCell>
                      <Input type="number" min={1} value={v}
                        onChange={(e) => setEdits((s) => ({ ...s, [p.tool_id]: Number(e.target.value) }))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" disabled={!dirty || savingId === p.tool_id} onClick={() => save(p.tool_id)}>
                        {savingId === p.tool_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pricing.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No pricing rows yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <GrantCreditsForm onDone={load} />

      <Card>
        <CardHeader><CardTitle>Recent admin grants</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{format(new Date(r.created_at), "MMM d, HH:mm")}</TableCell>
                  <TableCell className="text-xs">{r.user_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{r.delta > 0 ? `+${r.delta}` : r.delta}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.metadata?.bucket === "paid" ? "Lasting" : r.metadata?.bucket === "free" ? "Free" : ""} {(r.metadata?.note as string) || "—"}</TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No grants yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> User credits & purchases</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Per-user balance, total credits bought, and ₹ spent. Click any row to see purchase history.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input placeholder="Filter by email or name..." value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="max-w-sm" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="spent">Sort: ₹ spent</option>
              <option value="bought">Sort: credits bought</option>
              <option value="balance">Sort: current balance</option>
              <option value="recent">Sort: most recent purchase</option>
            </select>
            <span className="text-xs text-muted-foreground self-center sm:ml-auto">{userSummaries.length} users tracked</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Credits bought</TableHead>
                  <TableHead className="text-right">₹ spent</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead>Last purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSummaries
                  .filter((u) => {
                    const q = userFilter.trim().toLowerCase();
                    if (!q) return true;
                    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
                  })
                  .sort((a, b) => {
                    if (sortBy === "spent") return b.total_inr_spent - a.total_inr_spent;
                    if (sortBy === "bought") return b.total_credits_bought - a.total_credits_bought;
                    if (sortBy === "balance") return (b.free_balance + b.paid_balance) - (a.free_balance + a.paid_balance);
                    return new Date(b.last_purchase_at ?? 0).getTime() - new Date(a.last_purchase_at ?? 0).getTime();
                  })
                  .slice(0, 200)
                  .map((u) => {
                    const isOpen = expanded === u.user_id;
                    return (
                      <Fragment key={u.user_id}>
                        <TableRow className="cursor-pointer hover:bg-accent/40" onClick={() => setExpanded(isOpen ? null : u.user_id)}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{u.email}</span>
                              <span className="text-xs text-muted-foreground">{u.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <span className="font-medium">{u.free_balance + u.paid_balance}</span>
                            <span className="text-xs text-muted-foreground ml-1">({u.free_balance}f+{u.paid_balance}p)</span>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">{u.total_credits_bought}</TableCell>
                          <TableCell className="text-right text-sm font-medium">₹{u.total_inr_spent.toLocaleString("en-IN")}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{u.purchase_count}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.last_purchase_at ? format(new Date(u.last_purchase_at), "MMM d, yyyy HH:mm") : "—"}</TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30">
                              {u.purchases.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">No purchases.</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Pack</TableHead>
                                      <TableHead className="text-right">Credits</TableHead>
                                      <TableHead className="text-right">₹</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Razorpay payment</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {u.purchases.map((p) => (
                                      <TableRow key={p.id}>
                                        <TableCell className="text-xs">{format(new Date(p.paid_at ?? p.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                                        <TableCell className="text-xs">{p.pack_id}</TableCell>
                                        <TableCell className="text-right text-xs">{p.credits}</TableCell>
                                        <TableCell className="text-right text-xs">₹{p.inr_amount}</TableCell>
                                        <TableCell className="text-xs">
                                          <span className={
                                            p.status === "paid" ? "text-green-600 font-medium" :
                                            p.status === "failed" ? "text-destructive" :
                                            "text-muted-foreground"
                                          }>{p.status}</span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground font-mono">{p.razorpay_payment_id ?? "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                {userSummaries.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No user wallets yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsAdmin;
