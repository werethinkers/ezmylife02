import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  company_size: string | null;
  use_case: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export const EnterpriseLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("enterprise_inquiries").select("*").order("created_at", { ascending: false });
      setLeads((data as Lead[]) ?? []);
    })();
  }, []);

  return (
    <CollapsibleCard defaultOpen title={<>Enterprise leads ({leads.length})</>} size="lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Use case</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-xs">{format(new Date(l.created_at), "MMM d, HH:mm")}</TableCell>
              <TableCell className="text-sm font-medium">{l.name}</TableCell>
              <TableCell className="text-sm">{l.email}</TableCell>
              <TableCell className="text-sm">{l.company ?? "—"}</TableCell>
              <TableCell className="text-sm">{l.company_size ?? "—"}</TableCell>
              <TableCell className="text-xs max-w-[200px] truncate">{l.use_case ?? "—"}</TableCell>
              <TableCell className="text-xs max-w-[260px] truncate">{l.message ?? "—"}</TableCell>
              <TableCell><Badge variant="outline">{l.status}</Badge></TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </CollapsibleCard>
  );
};

export default EnterpriseLeads;
