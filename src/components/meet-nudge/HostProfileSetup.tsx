import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Briefcase, Building2, Globe, Linkedin, Mail, Phone, FileText } from "lucide-react";

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
  { key: "name", label: "Your Name *", icon: User, placeholder: "John Doe", required: true },
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

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
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

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set Up Your Host Profile</CardTitle>
          <p className="text-sm text-muted-foreground">Fill in your details so guests can connect with you</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {field.label}
                </Label>
                {field.multiline ? (
                  <Textarea
                    value={profile[field.key]}
                    onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    value={profile[field.key]}
                    onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            );
          })}

          <Button className="w-full mt-2" onClick={handleSave} disabled={saving} size="lg">
            {saving ? "Saving..." : "Save Profile ✓"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
