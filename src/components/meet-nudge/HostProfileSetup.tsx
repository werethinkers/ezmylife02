import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { User, Briefcase, Building2, Globe, Linkedin, Mail, Phone, FileText, Check, ArrowRight, ArrowLeft } from "lucide-react";

interface HostProfile {
  name: string;
  occupation: string;
  business_name: string;
  business_url: string;
  linkedin_url: string;
  email: string;
  phone: string;
  bio: string;
}

const FIELDS: { key: keyof HostProfile; label: string; icon: any; placeholder: string; required?: boolean; multiline?: boolean }[] = [
  { key: "name", label: "Your Name", icon: User, placeholder: "John Doe", required: true },
  { key: "occupation", label: "Occupation / Title", icon: Briefcase, placeholder: "Product Manager" },
  { key: "business_name", label: "Company", icon: Building2, placeholder: "Acme Inc." },
  { key: "business_url", label: "Website", icon: Globe, placeholder: "https://example.com" },
  { key: "linkedin_url", label: "LinkedIn URL", icon: Linkedin, placeholder: "https://linkedin.com/in/..." },
  { key: "email", label: "Email", icon: Mail, placeholder: "john@example.com" },
  { key: "phone", label: "Phone / WhatsApp", icon: Phone, placeholder: "+91 9876543210" },
  { key: "bio", label: "Short Bio", icon: FileText, placeholder: "Tell people about yourself...", multiline: true },
];

interface Props {
  userId: string;
  onComplete: () => void;
  existingProfile?: HostProfile | null;
}

export default function HostProfileSetup({ userId, onComplete, existingProfile }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<HostProfile>({
    name: "", occupation: "", business_name: "", business_url: "",
    linkedin_url: "", email: "", phone: "", bio: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }
    // Pre-fill from user profile
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (data) {
        setProfile(prev => ({
          ...prev,
          name: data.full_name || data.display_name || prev.name,
          occupation: data.job_title || prev.occupation,
          business_name: data.company || prev.business_name,
          business_url: data.website || prev.business_url,
          email: data.email || prev.email,
          phone: data.phone_number || prev.phone,
          bio: data.bio || prev.bio,
        }));
      }
    })();
  }, [userId, existingProfile]);

  const currentField = FIELDS[step];
  const isLast = step === FIELDS.length - 1;

  const handleNext = () => {
    if (currentField.required && !profile[currentField.key]) {
      toast({ title: `${currentField.label} is required`, variant: "destructive" });
      return;
    }
    if (isLast) handleSave();
    else setStep(s => s + 1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("meet_nudge_profiles").upsert({
        host_id: userId,
        ...profile,
      });
      if (error) throw error;
      toast({ title: "Profile saved! 🎉" });
      onComplete();
    } catch (e: any) {
      toast({ title: "Error saving profile", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !currentField.multiline) handleNext();
  };

  const Icon = currentField.icon;

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set Up Your Host Profile</CardTitle>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {FIELDS.length}</p>
          <div className="flex gap-1 justify-center mt-3">
            {FIELDS.map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <Label className="text-base font-medium">{currentField.label}</Label>
              </div>
              {currentField.multiline ? (
                <Textarea
                  value={profile[currentField.key]}
                  onChange={e => setProfile(p => ({ ...p, [currentField.key]: e.target.value }))}
                  placeholder={currentField.placeholder}
                  rows={3}
                  autoFocus
                />
              ) : (
                <Input
                  value={profile[currentField.key]}
                  onChange={e => setProfile(p => ({ ...p, [currentField.key]: e.target.value }))}
                  placeholder={currentField.placeholder}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={handleNext} disabled={saving}>
              {isLast ? (
                <>{saving ? "Saving..." : "Complete"} <Check className="h-4 w-4 ml-1" /></>
              ) : (
                <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
