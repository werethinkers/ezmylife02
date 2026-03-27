import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import SEOFooter from "@/components/SEOFooter";
import HostProfileSetup from "@/components/meet-nudge/HostProfileSetup";
import EventsDashboard from "@/components/meet-nudge/EventsDashboard";
import AllContacts from "@/components/meet-nudge/AllContacts";
import ContactsAnalytics from "@/components/meet-nudge/ContactsAnalytics";
import { CalendarDays, Users, Settings, BarChart3 } from "lucide-react";

const MeetNudge = () => {
  const { user } = useAuth();
  const [hostProfile, setHostProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("meet_nudge_profiles").select("*").eq("host_id", user.id).single();
    setHostProfile(data);
    setProfileLoading(false);
  };

  useEffect(() => { fetchProfile(); }, [user]);

  // Save session for tool_sessions like other tools
  useEffect(() => {
    if (!user || !hostProfile) return;
    supabase.from("tool_sessions").upsert({
      user_id: user.id, tool_id: "meet-nudge",
      session_data: { last_visited: new Date().toISOString() },
    }, { onConflict: "user_id,tool_id" });
  }, [user, hostProfile]);

  if (!user) return null;
  if (profileLoading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center h-[60vh] text-muted-foreground">Loading...</div></div>;

  if (!hostProfile || editing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 pb-8">
          <HostProfileSetup userId={user.id} onComplete={() => { setEditing(false); fetchProfile(); }} existingProfile={editing ? hostProfile : null} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-8 px-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Meet Nudge</h1>
            <p className="text-sm text-muted-foreground">Welcome, {hostProfile.name} 👋</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="events" className="flex-1 gap-1"><CalendarDays className="h-4 w-4" /> Events</TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1 gap-1"><Users className="h-4 w-4" /> All Contacts</TabsTrigger>
          </TabsList>
          <TabsContent value="events">
            <EventsDashboard userId={user.id} hostProfile={hostProfile} />
          </TabsContent>
          <TabsContent value="contacts">
            <AllContacts userId={user.id} hostProfile={hostProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MeetNudge;
