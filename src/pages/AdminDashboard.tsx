import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Activity, Crown, BarChart3, ExternalLink, Wrench, MessageSquarePlus, Archive, Handshake, KeyRound, LineChart, Link as LinkIcon, Ticket, BookHeart } from "lucide-react";
import ToolRequests from "@/components/admin/ToolRequests";
import ArchivedEvents from "@/components/admin/ArchivedEvents";
import ActivityArchive from "@/components/admin/ActivityArchive";
import MeetNudgeAdmin from "@/components/admin/MeetNudgeAdmin";
import GeminiKeysManager from "@/components/admin/GeminiKeysManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import UtmLinkBuilder from "@/components/admin/UtmLinkBuilder";
import CouponManager from "@/components/admin/CouponManager";
import VirasatArchive from "@/components/admin/VirasatArchive";

import { ToolManagement } from "@/components/admin/ToolManagement";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  action_details: Record<string, unknown> | null;
  created_at: string;
}

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
  created_at: string;
}

interface PremiumAccess {
  id: string;
  user_id: string;
  access_type: string;
  expires_at: string | null;
  granted_at: string;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumAccess[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "premium" | "tool-usage" | "tool-mgmt" | "tool-requests" | "archived-events" | "meet-nudge" | "api-keys" | "analytics" | "utm" | "coupons" | "virasat">("analytics");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    const checkAccess = async () => {
      const [{ data: isAdminRole }, { data: isModRole }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "moderator" }),
      ]);
      if (!isAdminRole && !isModRole) { navigate("/"); return; }
      setIsAdmin(true);
      setIsViewOnly(!isAdminRole && !!isModRole);
      setChecking(false);
      fetchData();
    };
    checkAccess();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    const [logsRes, profilesRes, premiumRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("premium_access").select("*").order("granted_at", { ascending: false }),
    ]);
    if (logsRes.data) setLogs(logsRes.data as ActivityLog[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (premiumRes.data) setPremiumUsers(premiumRes.data);
  };

  const getEmailForUser = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.email || profile?.display_name || userId.slice(0, 8);
  };

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

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = {
    totalUsers: profiles.length,
    totalLogs: logs.length,
    premiumUsers: premiumUsers.length,
    todayLogins: logs.filter(l => l.action_type === "login" && new Date(l.created_at).toDateString() === new Date().toDateString()).length,
  };

  const toolUsageLogs = logs.filter(l => l.action_type === "tool_usage");
  const toolCounts: Record<string, { count: number; name: string }> = {};
  const userToolUsage: Record<string, Record<string, number>> = {};

  toolUsageLogs.forEach(log => {
    const details = log.action_details as Record<string, unknown> | null;
    const toolId = (details?.tool_id as string) || "unknown";
    const toolName = (details?.tool_name as string) || toolId;
    const userLabel = getEmailForUser(log.user_id);
    if (!toolCounts[toolId]) toolCounts[toolId] = { count: 0, name: toolName };
    toolCounts[toolId].count++;
    if (!userToolUsage[userLabel]) userToolUsage[userLabel] = {};
    userToolUsage[userLabel][toolName] = (userToolUsage[userLabel][toolName] || 0) + 1;
  });

  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1].count - a[1].count);
  const sortedUserUsage = Object.entries(userToolUsage).sort((a, b) => {
    const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
    const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
    return totalB - totalA;
  });

  const tabs = [
    { id: "analytics" as const, label: "Analytics", icon: LineChart },
    { id: "logs" as const, label: "Activity Logs", icon: Activity },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "premium" as const, label: "Premium", icon: Crown },
    { id: "tool-usage" as const, label: "Tool Usage", icon: BarChart3 },
    ...(!isViewOnly ? [{ id: "tool-mgmt" as const, label: "Tool Management", icon: Wrench }] : []),
    { id: "tool-requests" as const, label: "Tool Requests", icon: MessageSquarePlus },
    { id: "archived-events" as const, label: "Archived Events", icon: Archive },
    { id: "meet-nudge" as const, label: "Meet Nudge", icon: Handshake },
    { id: "virasat" as const, label: "Virasat", icon: BookHeart },
    ...(!isViewOnly ? [{ id: "utm" as const, label: "UTM Links", icon: LinkIcon }] : []),
    ...(!isViewOnly ? [{ id: "coupons" as const, label: "Coupons", icon: Ticket }] : []),
    ...(!isViewOnly ? [{ id: "api-keys" as const, label: "API Keys", icon: KeyRound }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        {isViewOnly && <p className="text-sm text-muted-foreground mb-6">View-only access</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users },
            { label: "Activity Logs", value: stats.totalLogs, icon: Activity },
            { label: "Premium Users", value: stats.premiumUsers, icon: Crown },
            { label: "Today's Logins", value: stats.todayLogins, icon: BarChart3 },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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

        {activeTab === "logs" && (
          <ActivityArchive logs={logs} profiles={profiles} />
        )}

        {activeTab === "users" && (
          <>
            <Card>
              <CardHeader><CardTitle>All Users ({profiles.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium">{p.full_name || p.display_name || "—"}</TableCell>
                        <TableCell className="text-sm">{p.email || "—"}</TableCell>
                        <TableCell className="text-sm">{p.company || "—"}</TableCell>
                        <TableCell className="text-sm">{p.job_title || "—"}</TableCell>
                        <TableCell className="text-sm">{p.location || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{p.auth_provider || "email"}</Badge></TableCell>
                        <TableCell className="text-xs">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/admin/user/${p.id}`, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "premium" && (
          <Card>
            <CardHeader><CardTitle>Premium Subscriptions</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {premiumUsers.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{getEmailForUser(p.user_id)}</TableCell>
                      <TableCell><Badge variant="outline">{p.access_type}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(p.granted_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-xs">{p.expires_at ? format(new Date(p.expires_at), "MMM d, yyyy") : "Never"}</TableCell>
                    </TableRow>
                  ))}
                  {premiumUsers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No premium users</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === "tool-usage" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Most Used Tools</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Tool</TableHead><TableHead className="text-right">Uses</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sortedTools.map(([, tool], i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{i + 1}</TableCell>
                        <TableCell className="text-sm">{tool.name}</TableCell>
                        <TableCell className="text-right"><Badge variant="outline" className="bg-primary/10 text-primary">{tool.count}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {sortedTools.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No tool usage data yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>User Tool Usage</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Tools Used</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {sortedUserUsage.map(([user, tools], i) => {
                      const total = Object.values(tools).reduce((s, v) => s + v, 0);
                      const topTools = Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 3);
                      return (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{user}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {topTools.map(([name, count]) => `${name} (${count})`).join(", ")}
                            {Object.keys(tools).length > 3 && ` +${Object.keys(tools).length - 3} more`}
                          </TableCell>
                          <TableCell className="text-right"><Badge variant="outline">{total}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                    {sortedUserUsage.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No tool usage data yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "tool-mgmt" && <ToolManagement />}
        {activeTab === "tool-requests" && <ToolRequests />}
        {activeTab === "archived-events" && <ArchivedEvents />}
        {activeTab === "meet-nudge" && <MeetNudgeAdmin />}
        {activeTab === "virasat" && <VirasatArchive />}
        {activeTab === "api-keys" && !isViewOnly && <GeminiKeysManager />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "utm" && !isViewOnly && <UtmLinkBuilder />}
        {activeTab === "coupons" && !isViewOnly && <CouponManager />}
      </div>
    </div>
  );
};

export default AdminDashboard;
