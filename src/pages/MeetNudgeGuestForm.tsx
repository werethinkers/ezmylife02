import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Phone, Briefcase, Building2, MapPin, Globe, Linkedin, Mail, Sparkles, Download, PartyPopper, Search, Copy, ArrowRight } from "lucide-react";

interface HostProfile {
  name: string; occupation: string | null; business_name: string | null; business_url: string | null;
  linkedin_url: string | null; email: string | null; phone: string | null; bio: string | null;
  nudge_id: string | null;
}

const MeetNudgeGuestForm = () => {
  const { eventSlug, hostSlug } = useParams<{ eventSlug: string; hostSlug?: string }>();
  const [event, setEvent] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nudgeIdLookup, setNudgeIdLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [returnedNudgeId, setReturnedNudgeId] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  const [form, setForm] = useState({
    name: "", phone: "", email: "", occupation: "",
    business_name: "", location: "", website: "", linkedin_url: "", fun_fact: "",
  });

  useEffect(() => {
    (async () => {
      if (!eventSlug) return;
      const { data: ev } = await supabase.from("meet_nudge_events").select("*").eq("slug", eventSlug).single();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);
      const { data: hp } = await supabase.from("meet_nudge_profiles").select("*").eq("host_id", ev.host_id).single();
      setHostProfile(hp as HostProfile | null);
      setLoading(false);
    })();
  }, [eventSlug]);

  const handleNudgeIdLookup = async () => {
    if (!nudgeIdLookup.trim()) return;
    setLookingUp(true);
    const { data } = await supabase
      .from("meet_nudge_profiles")
      .select("*")
      .eq("nudge_id", nudgeIdLookup.trim().toUpperCase().replace(/[\s\-_]/g, ""))
      .single();
    setLookingUp(false);
    if (data) {
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        occupation: data.occupation || "",
        business_name: data.business_name || "",
        location: "",
        website: data.business_url || "",
        linkedin_url: data.linkedin_url || "",
        fun_fact: "",
      });
      toast({ title: `Welcome back, ${data.name}! 👋` });
    } else {
      toast({ title: "Nudge ID not found", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.email || !form.occupation) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Call edge function for background account creation
      const { data: signupData, error: signupError } = await supabase.functions.invoke("meet-nudge-signup", {
        body: {
          ...form,
          event_id: event?.id,
          host_id: event?.host_id,
        },
      });

      if (signupError) throw signupError;
      setReturnedNudgeId(signupData?.nudge_id || null);
      setDone(true);
    } catch (err: any) {
      toast({ title: "Error submitting", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadVCard = () => {
    if (!hostProfile) return;
    const vcard = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${hostProfile.name}`,
      hostProfile.occupation ? `TITLE:${hostProfile.occupation}` : "",
      hostProfile.business_name ? `ORG:${hostProfile.business_name}` : "",
      hostProfile.phone ? `TEL:${hostProfile.phone}` : "",
      hostProfile.email ? `EMAIL:${hostProfile.email}` : "",
      hostProfile.business_url ? `URL:${hostProfile.business_url}` : "",
      hostProfile.linkedin_url ? `X-SOCIALPROFILE;type=linkedin:${hostProfile.linkedin_url}` : "",
      hostProfile.bio ? `NOTE:${hostProfile.bio}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\n");
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${hostProfile.name.replace(/\s+/g, "_")}.vcf`; a.click();
    URL.revokeObjectURL(url);
  };

  const copyNudgeId = () => {
    if (returnedNudgeId) {
      navigator.clipboard.writeText(returnedNudgeId);
      toast({ title: "Nudge ID copied! 📋" });
    }
  };

  const sendMagicLink = async () => {
    if (!form.email) return;
    const redirectUrl = `${window.location.origin}/meet-nudge`;
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast({ title: "Error sending login link", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login link sent! Check your email 📧" });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Event not found</div>;

  if (done) {
    const seconds = Math.round((Date.now() - startTime.current) / 1000);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full space-y-6">
          <PartyPopper className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">You're all set! 🎉</h1>
          <p className="text-muted-foreground">Completed in {seconds}s</p>

          {returnedNudgeId && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Your Nudge ID</p>
                <p className="text-2xl font-bold tracking-wider text-primary">{returnedNudgeId}</p>
                <p className="text-xs text-muted-foreground">Share this at events instead of scanning QR! (no dashes needed)</p>
                <Button size="sm" variant="outline" onClick={copyNudgeId}>
                  <Copy className="h-4 w-4 mr-1" /> Copy Nudge ID
                </Button>
              </CardContent>
            </Card>
          )}

          {hostProfile && (
            <Card className="text-left">
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-base">Connect with {hostProfile.name}</h3>
                {hostProfile.occupation && <p className="text-sm text-muted-foreground">{hostProfile.occupation}{hostProfile.business_name ? ` at ${hostProfile.business_name}` : ""}</p>}
                {hostProfile.bio && <p className="text-sm text-muted-foreground">{hostProfile.bio}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={downloadVCard}><Download className="h-4 w-4 mr-1" /> Save Contact</Button>
                  {hostProfile.linkedin_url && <Button size="sm" variant="outline" onClick={() => window.open(hostProfile.linkedin_url!, "_blank")}><Linkedin className="h-4 w-4 mr-1" /> LinkedIn</Button>}
                  {hostProfile.business_url && <Button size="sm" variant="outline" onClick={() => window.open(hostProfile.business_url!, "_blank")}><Globe className="h-4 w-4 mr-1" /> Website</Button>}
                </div>
              </CardContent>
            </Card>
          )}

          <Button className="w-full" onClick={sendMagicLink}>
            <ArrowRight className="h-4 w-4 mr-1" /> Create Account & Start Networking
          </Button>
          <p className="text-xs text-muted-foreground">We'll send a login link to {form.email}</p>
        </motion.div>
      </div>
    );
  }

  const FIELDS = [
    { key: "name", label: "Your Name *", icon: User, placeholder: "John Doe", required: true },
    { key: "phone", label: "WhatsApp / Phone *", icon: Phone, placeholder: "+91 9876543210", required: true },
    { key: "email", label: "Email *", icon: Mail, placeholder: "you@example.com", required: true },
    { key: "occupation", label: "What do you do? *", icon: Briefcase, placeholder: "Product Designer", required: true },
    { key: "business_name", label: "Company", icon: Building2, placeholder: "Acme Inc." },
    { key: "location", label: "Location", icon: MapPin, placeholder: "Mumbai, India" },
    { key: "website", label: "Website", icon: Globe, placeholder: "https://..." },
    { key: "linkedin_url", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/..." },
    { key: "fun_fact", label: "Fun Fact ✨", icon: Sparkles, placeholder: "I once climbed Everest..." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pt-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">👋 Connect at {event.name}</h1>
          {hostProfile && <p className="text-sm text-muted-foreground">Hosted by {hostProfile.name}</p>}
        </div>

        {/* Nudge ID lookup */}
        <Card className="border-dashed">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-2">Already have a Nudge ID?</p>
            <div className="flex gap-2">
              <Input
                value={nudgeIdLookup}
                onChange={e => setNudgeIdLookup(e.target.value)}
                placeholder="e.g. ABHIORBIT23"
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && handleNudgeIdLookup()}
              />
              <Button variant="outline" onClick={handleNudgeIdLookup} disabled={lookingUp}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {FIELDS.map(field => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {field.label}
                  </Label>
                  <Input
                    value={(form as any)[field.key] || ""}
                    onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
              );
            })}

            <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting} size="lg">
              {submitting ? "Submitting..." : "Submit & Connect ✨"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeetNudgeGuestForm;
