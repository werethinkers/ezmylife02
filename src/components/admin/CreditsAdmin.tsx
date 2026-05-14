import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Zap, Search } from "lucide-react";
import { format } from "date-fns";

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

  const load = async () => {
    setLoading(true);
    const [{ data: pr }, { data: cat }, { data: led }] = await Promise.all([
      supabase.from("tool_pricing").select("tool_id, cost_inr, credit_cost").order("tool_id"),
      supabase.from("tools_catalog").select("id, name"),
      supabase.from("credit_ledger").select("*").eq("reason", "admin_adjust").order("created_at", { ascending: false }).limit(20),
    ]);
    setPricing((pr || []) as Pricing[]);
    const map: Record<string, string> = {};
    (cat as CatalogRow[] | null)?.forEach((c) => { map[c.id] = c.name; });
    setCatalog(map);
    setRecent((led || []) as LedgerRow[]);
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
          <a href="/admin/bulk-qa" className="text-xs underline text-muted-foreground hover:text-foreground">Open Bulk QA →</a>
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

      <Card>
        <CardHeader>
          <CardTitle>Grant free credits to a user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search by email or name" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <Button variant="outline" onClick={doSearch}><Search className="h-4 w-4" /></Button>
          </div>
          {results.length > 0 && (
            <div className="border border-border rounded-md divide-y">
              {results.map((r) => (
                <button key={r.id}
                  onClick={() => { setPicked(r); setResults([]); setSearch(r.email || ""); }}
                  className="w-full text-left p-2 hover:bg-accent text-sm flex justify-between"
                >
                  <span>{r.full_name || r.display_name || "—"}</span>
                  <span className="text-muted-foreground">{r.email}</span>
                </button>
              ))}
            </div>
          )}
          {picked && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              Selected: <strong>{picked.email}</strong>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Credits" value={grantAmt} onChange={(e) => setGrantAmt(Number(e.target.value))} />
            <Input placeholder="Note (optional)" value={grantNote} onChange={(e) => setGrantNote(e.target.value)} />
          </div>
          <Button onClick={grant} disabled={!picked || !grantAmt || granting}>
            {granting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Grant {grantAmt} credits
          </Button>
        </CardContent>
      </Card>

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
                  <TableCell className="text-xs text-muted-foreground">{(r.metadata?.note as string) || "—"}</TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No grants yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsAdmin;
