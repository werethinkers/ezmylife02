import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Briefcase, Building2, MapPin, Globe, Linkedin, Mail, Sparkles, Download, Check, PartyPopper } from "lucide-react";

interface HostProfile {
  name: string; occupation: string | null; business_name: string | null; business_url: string | null;
  linkedin_url: string | null; email: string | null; phone: string | null; bio: string | null;
}

const STEPS = [
  { key: "name", label: "What's your name?", emoji: "👋", icon: User, placeholder: "Your full name", required: true },
  { key: "phone", label: "WhatsApp number?", emoji: "📱", icon: Phone, placeholder: "+91 9876543210", required: true },
  { key: "occupation", label: "What do you do?", emoji: "💼", icon: Briefcase, placeholder: "Product Designer", required: true },
  { key: "business_name", label: "Company name?", emoji: "🏢", icon: Building2, placeholder: "Acme Inc." },
  { key: "location", label: "Where are you from?", emoji: "📍", icon: MapPin, placeholder: "Mumbai, India" },
  { key: "website", label: "Got a website?", emoji: "🌐", icon: Globe, placeholder: "https://..." },
  { key: "linkedin_url", label: "LinkedIn profile?", emoji: "💼", icon: Linkedin, placeholder: "https://linkedin.com/in/..." },
  { key: "email", label: "Email address?", emoji: "✉️", icon: Mail, placeholder: "you@example.com" },
  { key: "fun_fact", label: "Share a fun fact!", emoji: "✨", icon: Sparkles, placeholder: "I once climbed Everest..." },
] as const;

const ENCOURAGE = [
  "Great start! 🔥", "You're on a roll! 💪", "Keep going! 🚀", "Almost halfway! ⭐",
  "Doing awesome! 🎯", "So close! 🌟", "Nearly there! ✨", "One more! 🎉", "Last one! 🏁",
];

const MeetNudgeGuestForm = () => {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const [event, setEvent] = useState<any>(null);
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      if (!eventSlug) return;
      const { data: ev } = await supabase.from("meet_nudge_events").select("*").eq("slug", eventSlug).single();
      if (!ev) { setLoading(false); return; }
      setEvent(ev);
      const { data: hp } = await supabase.from("meet_nudge_profiles").select("*").eq("host_id", ev.host_id).single();
      setHostProfile(hp);
      setLoading(false);
    })();
  }, [eventSlug]);

  useEffect(() => { inputRef.current?.focus(); }, [step]);

  const currentStep = STEPS[step];
  const filledCount = Object.values(form).filter(v => v.trim()).length;

  const handleNext = async () => {
    const val = (form[currentStep.key] || "").trim();
    if (currentStep.required && !val) {
      toast({ title: `${currentStep.label.replace("?", "")} is required`, variant: "destructive" });
      return;
    }
    if (val) setStreak(s => s + 1); else setStreak(0);

    if (step === STEPS.length - 1) {
      // Submit
      setSubmitting(true);
      const { error } = await supabase.from("meet_nudge_contacts").insert({
        host_id: event.host_id, event_id: event.id, event_name: event.name,
        name: form.name, phone: form.phone, occupation: form.occupation,
        business_name: form.business_name || null, location: form.location || null,
        website: form.website || null, linkedin_url: form.linkedin_url || null,
        email: form.email || null, fun_fact: form.fun_fact || null,
      });
      setSubmitting(false);
      if (error) { toast({ title: "Error submitting", description: error.message, variant: "destructive" }); return; }
      setDone(true);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleNext(); };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Event not found</div>;

  if (done) {
    const seconds = Math.round((Date.now() - startTime.current) / 1000);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full space-y-6">
          <PartyPopper className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">You're all set! 🎉</h1>
          <p className="text-muted-foreground">Completed in {seconds}s with {filledCount} fields filled</p>
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
        </motion.div>
      </div>
    );
  }

  const Icon = currentStep.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{event.name}</span>
          <span>Step {step + 1}/{STEPS.length}</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i < step ? "bg-primary" : i === step ? "bg-primary animate-pulse" : "bg-muted-foreground/20"}`} />
          ))}
        </div>
      </div>

      {/* Streak */}
      {streak >= 2 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <span className="text-xs font-medium text-primary">🔥 {streak} streak!</span>
        </motion.div>
      )}

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-sm space-y-6"
          >
            <div className="text-center space-y-2">
              <span className="text-4xl">{currentStep.emoji}</span>
              <h2 className="text-xl font-semibold">{currentStep.label}</h2>
              <p className="text-sm text-muted-foreground">{ENCOURAGE[step]}</p>
            </div>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={form[currentStep.key] || ""}
                onChange={e => setForm(p => ({ ...p, [currentStep.key]: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder={currentStep.placeholder}
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              {step > 0 && <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">Back</Button>}
              <Button onClick={handleNext} disabled={submitting} className="flex-1">
                {step === STEPS.length - 1 ? (submitting ? "Submitting..." : "Submit ✨") : currentStep.required ? "Next →" : "Skip / Next →"}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Host badge */}
      {hostProfile && (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Hosted by <span className="font-medium text-foreground">{hostProfile.name}</span></p>
        </div>
      )}
    </div>
  );
};

export default MeetNudgeGuestForm;
