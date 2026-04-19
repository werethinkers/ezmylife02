import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  access_type: string;
  duration_days: number | null;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const ACCESS_TYPES = ["lifetime", "trial", "monthly", "yearly", "complimentary"];

const emptyForm = { code: "", description: "", access_type: "lifetime", duration_days: "", max_uses: "" };

const CouponManager = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const { data } = await supabase.from("coupon_codes").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
  };
  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!form.code) { toast.error("Code is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("coupon_codes").insert({
      code: form.code.toLowerCase().trim(),
      description: form.description || null,
      access_type: form.access_type,
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      is_active: true,
      created_by: user?.id ?? null,
    } as never);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Coupon created"); setForm(emptyForm); fetchAll(); }
  };

  const toggle = async (c: Coupon) => {
    const { error } = await supabase.from("coupon_codes").update({ is_active: !c.is_active } as never).eq("id", c.id);
    if (error) toast.error(error.message); else fetchAll();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coupon_codes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchAll(); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Create Coupon</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. summer2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Internal note" />
            </div>
            <div className="space-y-1.5">
              <Label>Access type</Label>
              <Select value={form.access_type} onValueChange={(v) => setForm({ ...form, access_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (days, blank = lifetime)</Label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} placeholder="30" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Max uses (blank = unlimited)</Label>
              <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="100" />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>Create Coupon</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Ticket className="h-4 w-4" /> All Coupons</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.code}</TableCell>
                  <TableCell><Badge variant="outline">{c.access_type}</Badge></TableCell>
                  <TableCell className="text-xs">{c.duration_days ? `${c.duration_days} days` : "Lifetime"}</TableCell>
                  <TableCell className="text-xs">{c.use_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</TableCell>
                  <TableCell><Switch checked={c.is_active} onCheckedChange={() => toggle(c)} /></TableCell>
                  <TableCell className="text-xs">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {coupons.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No coupons</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponManager;
