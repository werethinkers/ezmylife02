import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, RotateCcw, Calendar, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface ArchivedEvent {
  id: string;
  host_id: string;
  name: string;
  date: string | null;
  location: string | null;
  slug: string;
  created_at: string;
  deleted_at: string;
}

interface ArchivedContact {
  id: string;
  event_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  business_name: string | null;
  location: string | null;
  linkedin_url: string | null;
  website: string | null;
  fun_fact: string | null;
  created_at: string;
  deleted_at: string;
}

interface HostProfile {
  host_id: string;
  name: string;
  email: string | null;
}

export default function ArchivedEvents() {
  const [events, setEvents] = useState<ArchivedEvent[]>([]);
  const [contacts, setContacts] = useState<ArchivedContact[]>([]);
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchArchived = async () => {
    setLoading(true);
    const [evRes, coRes, hostRes] = await Promise.all([
      supabase.from("meet_nudge_events").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("meet_nudge_contacts").select("*").not("deleted_at", "is", null).order("created_at", { ascending: false }),
      supabase.from("meet_nudge_profiles").select("host_id, name, email"),
    ]);
    if (evRes.data) setEvents(evRes.data as ArchivedEvent[]);
    if (coRes.data) setContacts(coRes.data as ArchivedContact[]);
    if (hostRes.data) setHosts(hostRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchArchived(); }, []);

  const getHostName = (hostId: string) => {
    const host = hosts.find(h => h.host_id === hostId);
    return host?.name || host?.email || hostId.slice(0, 8);
  };

  const eventContacts = (eventId: string) => contacts.filter(c => c.event_id === eventId);

  const restoreEvent = async (eventId: string) => {
    setRestoring(eventId);
    try {
      await supabase.from("meet_nudge_events").update({ deleted_at: null } as any).eq("id", eventId);
      await supabase.from("meet_nudge_contacts").update({ deleted_at: null } as any).eq("event_id", eventId);
      toast({ title: "Event restored! ✅", description: "The event and all its contacts have been restored." });
      fetchArchived();
    } catch {
      toast({ title: "Restore failed", variant: "destructive" });
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Archived Meet Nudge Events ({events.length})</span>
          <Button size="sm" variant="outline" onClick={fetchArchived}>Refresh</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No archived events found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => {
                const ec = eventContacts(event.id);
                const isExpanded = expandedEvent === event.id;
                return (
                  <>
                    <TableRow key={event.id} className="cursor-pointer" onClick={() => setExpandedEvent(isExpanded ? null : event.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <div>
                            <p className="font-medium text-sm">{event.name}</p>
                            {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getHostName(event.host_id)}</TableCell>
                      <TableCell className="text-sm">{event.date || "—"}</TableCell>
                      <TableCell><Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{ec.length}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(event.deleted_at), "MMM d, HH:mm")}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          disabled={restoring === event.id}
                          onClick={(e) => { e.stopPropagation(); restoreEvent(event.id); }}
                        >
                          {restoring === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && ec.length > 0 && (
                      <TableRow key={`${event.id}-contacts`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <p className="text-xs font-semibold mb-2">Archived Contacts ({ec.length})</p>
                          <div className="grid gap-2 md:grid-cols-2">
                            {ec.map(c => (
                              <div key={c.id} className="text-xs border rounded-md p-2 bg-background">
                                <p className="font-medium">{c.name}</p>
                                {c.email && <p className="text-muted-foreground">{c.email}</p>}
                                {c.phone && <p className="text-muted-foreground">{c.phone}</p>}
                                {c.occupation && <p className="text-muted-foreground">{c.occupation}</p>}
                                {c.business_name && <p className="text-muted-foreground">{c.business_name}</p>}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
