import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Activity, BarChart3, ExternalLink, Wrench, MessageSquarePlus, Archive, Handshake, KeyRound, LineChart, Link as LinkIcon, Ticket, BookHeart, Footprints, Image as ImageIcon, Building2, Zap, LayoutGrid } from "lucide-react";
import HomeSectionsManager from "@/components/admin/HomeSectionsManager";
import ToolMediaManager from "@/components/admin/ToolMediaManager";
import EnterpriseLeads from "@/components/admin/EnterpriseLeads";
import ToolRequests from "@/components/admin/ToolRequests";
import ArchivedEvents from "@/components/admin/ArchivedEvents";
import ActivityArchive from "@/components/admin/ActivityArchive";
import MeetNudgeAdmin from "@/components/admin/MeetNudgeAdmin";
import GeminiKeysManager from "@/components/admin/GeminiKeysManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import UtmLinkBuilder from "@/components/admin/UtmLinkBuilder";
import CouponManager from "@/components/admin/CouponManager";
import VirasatArchive from "@/components/admin/VirasatArchive";
import VisitorsTracker from "@/components/admin/VisitorsTracker";
import CreditsAdmin from "@/components/admin/CreditsAdmin";

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

interface CreditsSold { credits: number; inr_amount: number }

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [creditsSold, setCreditsSold] = useState<CreditsSold>({ credits: 0, inr_amount: 0 });
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "credits" | "tool-usage" | "tool-mgmt" | "home-sections" | "tool-requests" | "archived-events" | "meet-nudge" | "api-keys" | "analytics" | "utm" | "coupons" | "virasat" | "visitors" | "tool-media" | "enterprise">("analytics");

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
    const [logsRes, profilesRes, purchasesRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("credit_purchases").select("credits, inr_amount").eq("status", "paid"),
    ]);
    if (logsRes.data) setLogs(logsRes.data as ActivityLog[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (purchasesRes.data) {
      const totals = purchasesRes.data.reduce(
        (acc, p) => ({ credits: acc.credits + (p.credits || 0), inr_amount: acc.inr_amount + (p.inr_amount || 0) }),
        { credits: 0, inr_amount: 0 },
      );
      setCreditsSold(totals);
    }
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
    creditsSold: creditsSold.credits,
    revenueInr: creditsSold.inr_amount,
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

  const groups: { label: string; tabs: { id: typeof activeTab; label: string; icon: typeof Activity }[] }[] = [
    {
      label: "Overview",
      tabs: [
        { id: "analytics", label: "Analytics", icon: LineChart },
        { id: "visitors", label: "Visitors", icon: Footprints },
        { id: "logs", label: "Activity Logs", icon: Activity },
      ],
    },
    {
      label: "People",
      tabs: [
        { id: "users", label: "Users", icon: Users },
        ...(!isViewOnly ? [{ id: "credits" as const, label: "Credits", icon: Zap }] : []),
      ],
    },
    {
      label: "Tools",
      tabs: [
        ...(!isViewOnly ? [{ id: "tool-mgmt" as const, label: "Tool Management", icon: Wrench }] : []),
        { id: "tool-usage", label: "Tool Usage", icon: BarChart3 },
        ...(!isViewOnly ? [{ id: "tool-media" as const, label: "Tool Media", icon: ImageIcon }] : []),
        ...(!isViewOnly ? [{ id: "home-sections" as const, label: "Home Sections", icon: LayoutGrid }] : []),
        { id: "tool-requests", label: "Tool Requests", icon: MessageSquarePlus },
      ],
    },
    {
      label: "Growth",
      tabs: [
        ...(!isViewOnly ? [{ id: "utm" as const, label: "UTM Links", icon: LinkIcon }] : []),
        ...(!isViewOnly ? [{ id: "coupons" as const, label: "Coupons", icon: Ticket }] : []),
        { id: "enterprise", label: "Enterprise Leads", icon: Building2 },
      ],
    },
    {
      label: "Modules",
      tabs: [
        { id: "meet-nudge", label: "Meet Nudge", icon: Handshake },
        { id: "virasat", label: "Virasat", icon: BookHeart },
        { id: "archived-events", label: "Archived Events", icon: Archive },
      ],
    },
    ...(!isViewOnly
      ? [{
          label: "System",
          tabs: [{ id: "api-keys" as const, label: "API Keys", icon: KeyRound }],
        }]
      : []),
  ];

  const allTabs = groups.flatMap((g) => g.tabs);
  const activeTabMeta = allTabs.find((t) => t.id === activeTab) ?? allTabs[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        {isViewOnly && <p className="text-sm text-muted-foreground mb-6">View-only access</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users },
            { label: "Credits Sold", value: `${stats.creditsSold} (₹${stats.revenueInr})`, icon: Zap },
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

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          {/* Mobile: section dropdown */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm"
            >
              {groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.tabs.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Desktop sidebar */}
          <nav className="hidden md:block sticky top-4 h-fit space-y-5 pr-2 border-r border-border/40">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 px-2">
                  {g.label}
                </p>
                <div className="space-y-0.5">
                  {g.tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                        activeTab === t.id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <t.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
              <activeTabMeta.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{activeTabMeta.label}</h2>
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

        {activeTab === "credits" && !isViewOnly && <CreditsAdmin />}

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
        {activeTab === "home-sections" && !isViewOnly && <HomeSectionsManager />}
        {activeTab === "tool-requests" && <ToolRequests />}
        {activeTab === "archived-events" && <ArchivedEvents />}
        {activeTab === "meet-nudge" && <MeetNudgeAdmin />}
        {activeTab === "virasat" && <VirasatArchive />}
        {activeTab === "api-keys" && !isViewOnly && <GeminiKeysManager />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "visitors" && <VisitorsTracker />}
        {activeTab === "utm" && !isViewOnly && <UtmLinkBuilder />}
        {activeTab === "coupons" && !isViewOnly && <CouponManager />}
        {activeTab === "tool-media" && !isViewOnly && <ToolMediaManager />}
        {activeTab === "enterprise" && <EnterpriseLeads />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
