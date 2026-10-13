import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Zap } from "lucide-react";

interface Profile { id: string; email: string | null; display_name: string | null; full_name: string | null }
type Bucket = "paid" | "free";

const QUICK = [100, 500, 1000, 5000];
const CONFIRM_ABOVE = 10000;

/** Admin-only: give or take away any whole number of credits. Server re-checks admin role. */
export function GrantCreditsForm({ fixedUser, onDone }: { fixedUser?: Profile; onDone?: () => void }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [picked, setPicked] = useState<Profile | null>(fixedUser ?? null);
  const [amount, setAmount] = useState<string>("100");
  const [bucket, setBucket] = useState<Bucket>("paid");
  const [mode, setMode] = useState<"give" | "take">("give");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<{ free: number; paid: number } | null>(null);

  useEffect(() => { if (fixedUser) setPicked(fixedUser); }, [fixedUser]);

  const loadBalance = async (uid: string) => {
    const { data } = await supabase.from("credit_wallets").select("free_balance, paid_balance").eq("user_id", uid).maybeSingle();
    setBalance({ free: data?.free_balance ?? 0, paid: data?.paid_balance ?? 0 });
  };
  useEffect(() => { if (picked) loadBalance(picked.id); else setBalance(null); }, [picked]);

  const doSearch = async () => {
    const q = search.trim().replace(/[%,()]/g, "");
    if (!q) { setResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, email, display_name, full_name")
      .or(`email.ilike.%${q}%,display_name.ilike.%${q}%,full_name.ilike.%${q}%`).limit(10);
    setResults((data || []) as Profile[]);
  };

  const n = Number(amount);
  const valid = Number.isInteger(n) && n > 0;
  const label = bucket === "paid" ? "lasting" : "free";

  const submit = async () => {
    if (!picked || !valid) return;
    const verb = mode === "give" ? "Give" : "Take away";
    if (n > CONFIRM_ABOVE && !window.confirm(`${verb} ${n.toLocaleString()} ${label} credits ${mode === "give" ? "to" : "from"} ${picked.email}?`)) return;
    setBusy(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("admin-tool-pricing", {
      body: { action: "grant_credits", user_id: picked.id, credits: mode === "give" ? n : -n, bucket, note },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setBusy(false);
    if (error || data?.error) {
      toast({ title: "Failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Done", description: `${mode === "give" ? "+" : "-"}${n.toLocaleString()} ${label} credits · ${picked.email}` });
    setNote("");
    loadBalance(picked.id);
    onDone?.();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Give or remove credits</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!fixedUser && (
          <>
            <div className="flex gap-2">
              <Input placeholder="Search by email or name" value={search}
                onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
              <Button variant="outline" onClick={doSearch}><Search className="h-4 w-4" /></Button>
            </div>
            {results.length > 0 && (
              <div className="border border-border rounded-md divide-y">
                {results.map((r) => (
                  <button key={r.id} onClick={() => { setPicked(r); setResults([]); setSearch(r.email || ""); }}
                    className="w-full text-left p-2 hover:bg-accent text-sm flex justify-between">
                    <span>{r.full_name || r.display_name || "—"}</span>
                    <span className="text-muted-foreground">{r.email}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {picked && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <strong>{picked.email}</strong>
            {balance && <span className="text-muted-foreground"> · Lasting {balance.paid.toLocaleString()} · Free {balance.free.toLocaleString()}</span>}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={mode === "give" ? "default" : "outline"} onClick={() => setMode("give")}>Give</Button>
          <Button size="sm" variant={mode === "take" ? "default" : "outline"} onClick={() => setMode("take")}>Take away</Button>
          <span className="w-px bg-border mx-1" />
          <Button size="sm" variant={bucket === "paid" ? "default" : "outline"} onClick={() => setBucket("paid")}>Lasting (never expire)</Button>
          <Button size="sm" variant={bucket === "free" ? "default" : "outline"} onClick={() => setBucket("free")}>Free (resets monthly)</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <Button key={q} size="sm" variant="secondary" onClick={() => setAmount(String(q))}>{q.toLocaleString()}</Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min={1} step={1} placeholder="Any amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button onClick={submit} disabled={!picked || !valid || busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
          {mode === "give" ? "Give" : "Take away"} {valid ? n.toLocaleString() : ""} {label} credits
        </Button>
      </CardContent>
    </Card>
  );
}
