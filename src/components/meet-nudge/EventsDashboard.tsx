import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Plus, QrCode, Trash2, MapPin, Calendar, Users, Camera } from "lucide-react";
import ContactCard from "./ContactCard";
import BusinessCardScanner from "./BusinessCardScanner";

interface Event {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  slug: string;
  created_at: string;
}

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

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
};

const getHostSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

export default function EventsDashboard({ userId, hostProfile }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newEvent, setNewEvent] = useState({ name: "", date: "", location: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [qrEvent, setQrEvent] = useState<Event | null>(null);
  const [scanEvent, setScanEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = window.location.origin;

  const fetchData = async () => {
    const [evRes, coRes] = await Promise.all([
      supabase.from("meet_nudge_events").select("*").eq("host_id", userId).order("created_at", { ascending: false }),
      supabase.from("meet_nudge_contacts").select("*").eq("host_id", userId).order("created_at", { ascending: false }),
    ]);
    if (evRes.data) setEvents(evRes.data);
    if (coRes.data) setContacts(coRes.data as Contact[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Realtime contacts
    const channel = supabase.channel("meet-nudge-contacts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "meet_nudge_contacts", filter: `host_id=eq.${userId}` }, (payload) => {
        setContacts(prev => [payload.new as Contact, ...prev]);
        toast({ title: `🎉 New contact: ${(payload.new as any).name}` });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const createEvent = async () => {
    if (!newEvent.name.trim()) { toast({ title: "Event name required", variant: "destructive" }); return; }
    const slug = generateSlug(newEvent.name);
    const { error } = await supabase.from("meet_nudge_events").insert({
      host_id: userId, name: newEvent.name, date: newEvent.date || null, location: newEvent.location || null, slug,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Event created! 🎊" });
    setNewEvent({ name: "", date: "", location: "" });
    setCreateOpen(false);
    fetchData();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("meet_nudge_contacts").delete().eq("event_id", id);
    await supabase.from("meet_nudge_events").delete().eq("id", id);
    toast({ title: "Event deleted" });
    fetchData();
  };

  const eventContacts = (eventId: string) => contacts.filter(c => c.event_id === eventId);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading events...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Events</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Event Name *</Label><Input value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} placeholder="Tech Meetup 2026" /></div>
              <div><Label>Date</Label><Input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
              <div><Label>Location</Label><Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="Mumbai, India" /></div>
              <Button onClick={createEvent} className="w-full">Create Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-8 text-center text-muted-foreground">No events yet. Create your first event to start collecting contacts!</CardContent></Card>
      )}

      {events.map(event => (
        <Card key={event.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">{event.name}</CardTitle>
                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                  {event.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>}
                  {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />{eventContacts(event.id).length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Dialog open={qrEvent?.id === event.id} onOpenChange={open => setQrEvent(open ? event : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><QrCode className="h-4 w-4 mr-1" /> QR Code</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader><DialogTitle className="text-center">{event.name}</DialogTitle></DialogHeader>
                  <div className="flex flex-col items-center gap-3 py-4">
                    <QRCodeSVG value={`${baseUrl}/e/${event.slug}`} size={200} />
                    <p className="text-xs text-muted-foreground text-center break-all">{baseUrl}/e/{event.slug}</p>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/e/${event.slug}`); toast({ title: "Link copied!" }); }}>Copy Link</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={scanEvent?.id === event.id} onOpenChange={open => setScanEvent(open ? event : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Camera className="h-4 w-4 mr-1" /> Scan Card</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Scan Business Card</DialogTitle></DialogHeader>
                  <BusinessCardScanner userId={userId} eventId={event.id} eventName={event.name} onSaved={() => { setScanEvent(null); fetchData(); }} />
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEvent(event.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {eventContacts(event.id).length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                {eventContacts(event.id).map(contact => (
                  <ContactCard key={contact.id} contact={contact} hostProfile={hostProfile} onUpdate={fetchData} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
