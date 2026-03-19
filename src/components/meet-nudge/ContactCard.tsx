import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Check, User, Briefcase, Building2, MapPin } from "lucide-react";

interface Contact {
  id: string;
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
}

interface Props {
  contact: Contact;
  hostProfile: any;
  onUpdate: () => void;
}

export default function ContactCard({ contact, hostProfile, onUpdate }: Props) {
  const sendWhatsApp = async () => {
    if (!contact.phone) { toast({ title: "No phone number", variant: "destructive" }); return; }
    const phone = contact.phone.replace(/[^0-9+]/g, "");
    const msg = `Hi ${contact.name}! 👋 It was great meeting you${contact.fun_fact ? ` — loved your fun fact: "${contact.fun_fact}"` : ""}. I'm ${hostProfile.name}${hostProfile.occupation ? `, ${hostProfile.occupation}` : ""}${hostProfile.business_name ? ` at ${hostProfile.business_name}` : ""}. Let's stay connected!${hostProfile.business_url ? `\n🌐 ${hostProfile.business_url}` : ""}${hostProfile.linkedin_url ? `\n💼 ${hostProfile.linkedin_url}` : ""}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    await supabase.from("meet_nudge_contacts").update({ intro_sent: true }).eq("id", contact.id);
    onUpdate();
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{contact.name}</span>
          {contact.intro_sent && <Badge variant="outline" className="text-xs gap-1 shrink-0"><Check className="h-3 w-3" /> Sent</Badge>}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          {contact.occupation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{contact.occupation}</span>}
          {contact.business_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{contact.business_name}</span>}
          {contact.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{contact.location}</span>}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={sendWhatsApp} className="shrink-0 ml-2 gap-1">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
    </div>
  );
}
