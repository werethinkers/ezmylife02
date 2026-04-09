import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Users, CalendarDays, Link2, Search } from "lucide-react";

interface MNProfile {
  host_id: string;
  name: string;
  nudge_id: string | null;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  business_name: string | null;
  created_at: string;
}

interface MNContact {
  id: string;
  host_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  event_name: string | null;
  event_id: string | null;
  connected_via_host_id: string | null;
  created_at: string;
}

interface MNEvent {
  id: string;
  host_id: string;
  name: string;
  slug: string;
  date: string | null;
  created_at: string;
}

export default function MeetNudgeAdmin() {
  const [profiles, setProfiles] = useState<MNProfile[]>([]);
  const [contacts, setContacts] = useState<MNContact[]>([]);
  const [events, setEvents] = useState<MNEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [pRes, cRes, eRes] = await Promise.all([
        supabase.from("meet_nudge_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("meet_nudge_contacts").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(500),
        supabase.from("meet_nudge_events").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      ]);
      setProfiles((pRes.data || []) as MNProfile[]);
      setContacts((cRes.data || []) as MNContact[]);
      setEvents((eRes.data || []) as MNEvent[]);
      setLoading(false);
    })();
  }, []);

  const q = search.toLowerCase();
  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(q) || (p.nudge_id || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q)
  );
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.event_name || "").toLowerCase().includes(q)
  );

  const getProfileName = (hostId: string) => profiles.find(p => p.host_id === hostId)?.name || hostId.slice(0, 8);

  // Event stats
  const eventStats = events.map(e => ({
    ...e,
    contactCount: contacts.filter(c => c.event_id === e.id).length,
    hostName: getProfileName(e.host_id),
  }));

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading Meet Nudge data...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{profiles.length}</p><p className="text-xs text-muted-foreground">Nudge Users</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Link2 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{contacts.length}</p><p className="text-xs text-muted-foreground">Total Contacts</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CalendarDays className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{events.length}</p><p className="text-xs text-muted-foreground">Events</p></div></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, nudge ID, email, or event..." className="pl-10" />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users ({filteredProfiles.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({filteredContacts.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({eventStats.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Nudge ID</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Occupation</TableHead><TableHead>Company</TableHead><TableHead>Joined</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredProfiles.map(p => (
                    <TableRow key={p.host_id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{p.nudge_id || "—"}</Badge></TableCell>
                      <TableCell className="text-sm">{p.email || "—"}</TableCell>
                      <TableCell className="text-sm">{p.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{p.occupation || "—"}</TableCell>
                      <TableCell className="text-sm">{p.business_name || "—"}</TableCell>
                      <TableCell className="text-xs">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {filteredProfiles.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Contact</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Occupation</TableHead><TableHead>Event</TableHead><TableHead>Collected By</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredContacts.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-sm">{c.email || "—"}</TableCell>
                      <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{c.occupation || "—"}</TableCell>
                      <TableCell className="text-sm">{c.event_name || "—"}</TableCell>
                      <TableCell className="text-sm">{getProfileName(c.host_id)}</TableCell>
                      <TableCell className="text-xs">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {filteredContacts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No contacts found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Event</TableHead><TableHead>Host</TableHead><TableHead>Date</TableHead><TableHead>Contacts</TableHead><TableHead>Slug</TableHead><TableHead>Created</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {eventStats.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-sm">{e.hostName}</TableCell>
                      <TableCell className="text-sm">{e.date || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{e.contactCount}</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{e.slug}</TableCell>
                      <TableCell className="text-xs">{format(new Date(e.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                  {eventStats.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No events found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
