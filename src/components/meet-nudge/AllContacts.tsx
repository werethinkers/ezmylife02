import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import ContactCard from "./ContactCard";

interface Contact {
  id: string;
  event_id: string | null;
  event_name: string | null;
  name: string;
  occupation: string | null;
  business_name: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website: string | null;
  fun_fact: string | null;
  intro_sent: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  hostProfile: any;
}

export default function AllContacts({ userId, hostProfile }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    const { data } = await supabase.from("meet_nudge_contacts").select("*").eq("host_id", userId).order("created_at", { ascending: false });
    if (data) setContacts(data as Contact[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
    const channel = supabase.channel("all-contacts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "meet_nudge_contacts", filter: `host_id=eq.${userId}` }, (payload) => {
        setContacts(prev => [payload.new as Contact, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const exportCSV = () => {
    const headers = "Name,Company,Designation,Location,Event,Email,Phone\n";
    const rows = contacts.map(c =>
      [c.name, c.business_name || "", c.occupation || "", c.location || "", c.event_name || "", c.email || "", c.phone || ""]
        .map(v => `"${v.replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "meet-nudge-contacts.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading contacts...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">All Contacts ({contacts.length})</h2>
        {contacts.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        )}
      </div>
      {contacts.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground">No contacts yet. Share your event QR code to start collecting!</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <ContactCard key={contact.id} contact={contact} hostProfile={hostProfile} onUpdate={fetchContacts} />
          ))}
        </div>
      )}
    </div>
  );
}
