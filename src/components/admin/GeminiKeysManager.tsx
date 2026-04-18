import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, KeyRound, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface GeminiKey {
  id: string;
  key_value: string;
  label: string | null;
  is_active: boolean;
  failure_count: number;
  last_used_at: string | null;
  created_at: string;
}

const GeminiKeysManager = () => {
  const [keys, setKeys] = useState<GeminiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gemini_api_keys" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load keys");
    else setKeys((data as unknown as GeminiKey[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const addKey = async () => {
    if (!newKey.trim()) {
      toast.error("Key value is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("gemini_api_keys" as never).insert({
      key_value: newKey.trim(),
      label: newLabel.trim() || null,
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Key added");
      setNewKey("");
      setNewLabel("");
      setDialogOpen(false);
      fetchKeys();
    }
    setSaving(false);
  };

  const toggleActive = async (key: GeminiKey) => {
    const { error } = await supabase
      .from("gemini_api_keys" as never)
      .update({ is_active: !key.is_active } as never)
      .eq("id", key.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Key ${!key.is_active ? "activated" : "disabled"}`);
      fetchKeys();
    }
  };

  const resetFailures = async (key: GeminiKey) => {
    const { error } = await supabase
      .from("gemini_api_keys" as never)
      .update({ failure_count: 0, is_active: true } as never)
      .eq("id", key.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Failures reset");
      fetchKeys();
    }
  };

  const deleteKey = async (key: GeminiKey) => {
    if (!confirm(`Delete key ${key.label || mask(key.key_value)}?`)) return;
    const { error } = await supabase.from("gemini_api_keys" as never).delete().eq("id", key.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Key deleted");
      fetchKeys();
    }
  };

  const mask = (val: string) => {
    if (val.length <= 8) return "••••" + val.slice(-2);
    return "••••••••" + val.slice(-4);
  };

  const activeCount = keys.filter((k) => k.is_active).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{keys.length}</p>
            <p className="text-xs text-muted-foreground">Total Keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{keys.length - activeCount}</p>
            <p className="text-xs text-muted-foreground">Disabled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Gemini API Keys
          </CardTitle>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Key
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Keys are tried in order. On failure, the system auto-rotates to the next key. Keys are auto-disabled after 5 consecutive failures.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="text-sm">{k.label || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{mask(k.key_value)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={k.is_active} onCheckedChange={() => toggleActive(k)} />
                      <Badge variant={k.is_active ? "default" : "outline"} className="text-xs">
                        {k.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.failure_count >= 5 ? "destructive" : k.failure_count > 0 ? "outline" : "secondary"} className="text-xs">
                      {k.failure_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.last_used_at ? format(new Date(k.last_used_at), "MMM d, HH:mm") : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(k.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {k.failure_count > 0 && (
                        <Button variant="ghost" size="icon" onClick={() => resetFailures(k)} title="Reset failures">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteKey(k)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {keys.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading..." : "No keys yet. Add one to enable AI fallback."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Gemini API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="AIza..."
              />
            </div>
            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Personal account #1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={addKey} disabled={saving}>{saving ? "Saving..." : "Add Key"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeminiKeysManager;
