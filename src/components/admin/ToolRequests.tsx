import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";

interface ToolRequest {
  id: string;
  name: string;
  email: string;
  tool_description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  reviewing: "bg-blue-500/10 text-blue-600",
  building: "bg-purple-500/10 text-purple-600",
  completed: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
};

const ToolRequests = () => {
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("tool_requests" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any;
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    // Real-time subscription
    const channel = supabase
      .channel("tool-requests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("tool_requests" as any) as any).update({ status }).eq("id", id);
  };

  const deleteRequest = async (id: string) => {
    await (supabase.from("tool_requests" as any) as any).delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <CollapsibleCard defaultOpen title={<>Tool Requests ({requests.length})</>} size="lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="max-w-[300px]">Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="text-xs whitespace-nowrap">
                {format(new Date(req.created_at), "MMM d, HH:mm")}
              </TableCell>
              <TableCell className="text-sm font-medium">{req.name}</TableCell>
              <TableCell className="text-sm">{req.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                <p className="line-clamp-2">{req.tool_description}</p>
              </TableCell>
              <TableCell>
                <Select defaultValue={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map((s) => (
                      <SelectItem key={s} value={s}>
                        <Badge variant="outline" className={statusColors[s]}>
                          {s}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => deleteRequest(req.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No tool requests yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </CollapsibleCard>
  );
};

export default ToolRequests;
