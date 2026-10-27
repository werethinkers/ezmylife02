import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleCard } from "@/components/admin/CollapsibleCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, User, Mail, Phone, Building, MapPin, Globe, Linkedin, Calendar, Shield, Activity, BarChart3, Crown } from "lucide-react";
import { format } from "date-fns";
import { GrantCreditsForm } from "@/components/admin/GrantCreditsForm";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  auth_provider: string | null;
  phone_number: string | null;
  bio: string | null;
  company: string | null;
  job_title: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: Record<string, unknown> | null;
  created_at: string;
}

interface PremiumAccess {
  id: string;
  user_id: string;
  access_type: string;
  expires_at: string | null;
  granted_at: string;
}

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [premium, setPremium] = useState<PremiumAccess | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "tools">("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    const check = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setChecking(false);
      fetchUserData();
    };
    check();
  }, [user, authLoading, navigate, userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    const [profileRes, logsRes, premiumRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("activity_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(500),
      supabase.from("premium_access").select("*").eq("user_id", userId).single(),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (logsRes.data) setLogs(logsRes.data as ActivityLog[]);
    if (premiumRes.data) setPremium(premiumRes.data);
  };

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin || !profile) return null;

  // Compute usage stats
  const toolUsageLogs = logs.filter(l => l.action_type === "tool_usage");
  const loginLogs = logs.filter(l => l.action_type === "login");
  const profileEditLogs = logs.filter(l => l.action_type === "profile_edit");

  const toolCounts: Record<string, { count: number; name: string; lastUsed: string }> = {};
  toolUsageLogs.forEach(log => {
    const details = log.action_details as Record<string, unknown> | null;
    const toolId = (details?.tool_id as string) || "unknown";
    const toolName = (details?.tool_name as string) || toolId;
    if (!toolCounts[toolId]) toolCounts[toolId] = { count: 0, name: toolName, lastUsed: log.created_at };
    toolCounts[toolId].count++;
    if (log.created_at > toolCounts[toolId].lastUsed) toolCounts[toolId].lastUsed = log.created_at;
  });
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1].count - a[1].count);

  const actionTypeColor = (type: string) => {
    const map: Record<string, string> = {
      login: "bg-blue-500/10 text-blue-500",
      signup: "bg-green-500/10 text-green-500",
      tool_usage: "bg-purple-500/10 text-purple-500",
      profile_edit: "bg-orange-500/10 text-orange-500",
      payment: "bg-emerald-500/10 text-emerald-500",
      subscription: "bg-yellow-500/10 text-yellow-500",
    };
    return map[type] || "bg-muted text-muted-foreground";
  };

  const infoItems = [
    { icon: User, label: "Full Name", value: profile.full_name },
    { icon: User, label: "Display Name", value: profile.display_name },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone_number },
    { icon: Building, label: "Company", value: profile.company },
    { icon: Shield, label: "Job Title", value: profile.job_title },
    { icon: MapPin, label: "Location", value: profile.location },
    { icon: Globe, label: "Website", value: profile.website },
    { icon: Shield, label: "Auth Provider", value: profile.auth_provider || "email" },
    { icon: Calendar, label: "Joined", value: format(new Date(profile.created_at), "MMM d, yyyy HH:mm") },
    { icon: Calendar, label: "Last Updated", value: format(new Date(profile.updated_at), "MMM d, yyyy HH:mm") },
  ];

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: User },
    { id: "activity" as const, label: "Activity Log", icon: Activity },
    { id: "tools" as const, label: "Tool Usage", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
          </Button>
        </div>

        <div className="mb-8">
          <GrantCreditsForm fixedUser={{ id: profile.id, email: profile.email, display_name: profile.display_name, full_name: profile.full_name }} />
        </div>


        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {(profile.full_name || profile.display_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || profile.display_name || "Unknown User"}</h1>
            <p className="text-muted-foreground">{profile.email || "No email"}</p>
            <div className="flex gap-2 mt-1">
              {premium && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Premium — {premium.access_type}</Badge>}
              <Badge variant="outline">{profile.auth_provider || "email"}</Badge>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Actions", value: logs.length, icon: Activity },
            { label: "Tools Used", value: Object.keys(toolCounts).length, icon: BarChart3 },
            { label: "Tool Opens", value: toolUsageLogs.length, icon: BarChart3 },
            { label: "Logins", value: loginLogs.length, icon: User },
            { label: "Profile Edits", value: profileEditLogs.length, icon: Shield },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid items-start gap-6 md:grid-cols-2">
            <CollapsibleCard title="Profile Information" size="lg">
              <div className="space-y-4">
                {infoItems.map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
              {profile.bio && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}
            </CollapsibleCard>

            <CollapsibleCard title="Subscription & Access" size="lg">
              {premium ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Premium Active</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Access Type</p>
                    <p className="text-sm font-medium">{premium.access_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Granted</p>
                    <p className="text-sm font-medium">{format(new Date(premium.granted_at), "MMM d, yyyy HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className="text-sm font-medium">{premium.expires_at ? format(new Date(premium.expires_at), "MMM d, yyyy HH:mm") : "Never"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No premium access</p>
              )}
            </CollapsibleCard>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <CollapsibleCard title={<>Activity History ({logs.length} events)</>} size="lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(log.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell><Badge variant="outline" className={actionTypeColor(log.action_type)}>{log.action_type}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[400px] truncate">{log.action_details ? JSON.stringify(log.action_details) : "—"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No activity logs</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CollapsibleCard>
        )}

        {/* Tools Tab */}
        {activeTab === "tools" && (
          <CollapsibleCard title="Tool Usage Breakdown" size="lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Times Used</TableHead>
                  <TableHead>Last Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTools.map(([, tool], i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{i + 1}</TableCell>
                    <TableCell className="text-sm">{tool.name}</TableCell>
                    <TableCell className="text-right"><Badge variant="outline" className="bg-primary/10 text-primary">{tool.count}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(tool.lastUsed), "MMM d, yyyy HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {sortedTools.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No tool usage data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CollapsibleCard>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetail;
