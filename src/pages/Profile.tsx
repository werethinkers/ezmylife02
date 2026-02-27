import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Mail, Phone, Building, MapPin, Globe, Briefcase, Lock, Key, Eye, EyeOff } from "lucide-react";
import { Navbar } from "@/components/Navbar";

interface ProfileData {
  display_name: string;
  full_name: string;
  phone_number: string;
  bio: string;
  company: string;
  job_title: string;
  location: string;
  website: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "", full_name: "", phone_number: "", bio: "", company: "", job_title: "", location: "", website: "",
  });

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, full_name, phone_number, bio, company, job_title, location, website, gemini_api_key")
        .eq("id", user?.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setGeminiApiKey(data.gemini_api_key || "");
        setProfile({
          display_name: data.display_name || "", full_name: data.full_name || "",
          phone_number: data.phone_number || "", bio: data.bio || "",
          company: data.company || "", job_title: data.job_title || "",
          location: data.location || "", website: data.website || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const previousProfile = { ...profile };
      const { error } = await supabase.from("profiles").upsert({
        id: user?.id, ...profile,
      });
      if (error) throw error;
      const changedFields: Record<string, { from: string; to: string }> = {};
      for (const key of Object.keys(profile) as (keyof ProfileData)[]) {
        if (profile[key] !== previousProfile[key]) {
          changedFields[key] = { from: previousProfile[key], to: profile[key] };
        }
      }
      if (Object.keys(changedFields).length > 0) logActivity("profile_edit", { changed_fields: changedFields });
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to change password.", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (profile.full_name) return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    if (profile.display_name) return profile.display_name.slice(0, 2).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-73px)] bg-background py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account information</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-8">
            {/* Profile Header */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-medium">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h2 className="font-display text-xl font-semibold">{profile.full_name || profile.display_name || "Your Name"}</h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="John Doe" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" placeholder="John" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} disabled={saving} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} disabled={saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us a bit about yourself..." value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} disabled={saving} rows={3} />
                </div>
              </CardContent>
            </Card>

            {/* Professional Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Professional Information</CardTitle>
                <CardDescription>Your work details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-2"><Building className="h-4 w-4" />Company</Label>
                    <Input id="company" placeholder="Your company" value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input id="jobTitle" placeholder="Your role" value={profile.job_title} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} disabled={saving} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2"><MapPin className="h-4 w-4" />Location</Label>
                    <Input id="location" placeholder="City, Country" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2"><Globe className="h-4 w-4" />Website</Label>
                    <Input id="website" type="url" placeholder="https://yoursite.com" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} disabled={saving} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Changes"}
              </Button>
            </div>
          </form>

          {/* Password Section */}
          <div className="mt-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle>
                <CardDescription>Set or update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={changingPassword} />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={changingPassword} />
                  </div>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>) : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          {/* API Key Section */}
          <div className="mt-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Your Gemini API Key</CardTitle>
                <CardDescription>Add your own Google Gemini API key to use when our default limits are reached. Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a>.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingApiKey(true);
                  try {
                    const { error } = await supabase.from("profiles").update({ gemini_api_key: geminiApiKey || null }).eq("id", user?.id);
                    if (error) throw error;
                    toast({ title: "API Key saved", description: "Your Gemini API key has been saved securely." });
                  } catch {
                    toast({ title: "Error", description: "Failed to save API key.", variant: "destructive" });
                  } finally {
                    setSavingApiKey(false);
                  }
                }} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="geminiKey">Gemini API Key</Label>
                    <div className="relative">
                      <Input
                        id="geminiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="AIza..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        disabled={savingApiKey}
                        className="pr-10"
                      />
                      <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your key is stored securely and used only for AI features when default limits are reached.</p>
                  </div>
                  <Button type="submit" disabled={savingApiKey}>
                    {savingApiKey ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save API Key"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
