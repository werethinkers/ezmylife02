import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, Users, Activity, BarChart3, ExternalLink, Wrench, MessageSquarePlus, Archive, Handshake, KeyRound, LineChart, Link as LinkIcon, Ticket, BookHeart, Footprints, Image as ImageIcon, Building2, Zap, LayoutGrid, Globe, Sparkles, Rocket, Download, Megaphone, PackageCheck, Undo2, ListChecks, Store, Gift, Mail } from "lucide-react";
import { WEBSITE_CATEGORIES } from "@/components/brand/nav";
import DataExport from "@/components/admin/DataExport";
import HomeSectionsManager from "@/components/admin/HomeSectionsManager";
import AdminSeoIndexing from "@/components/admin/AdminSeoIndexing";
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
import CardPromoManager from "@/components/admin/CardPromoManager";
import VirasatArchive from "@/components/admin/VirasatArchive";
import VisitorsTracker from "@/components/admin/VisitorsTracker";
import CreditsAdmin from "@/components/admin/CreditsAdmin";
import StatDrilldown, { STAT_KEYS, type StatKey } from "@/components/admin/StatDrilldown";
import ToolDemoEditor from "@/components/admin/ToolDemoEditor";
import PromoPagesManager from "@/components/admin/PromoPagesManager";

import { ToolManagement } from "@/components/admin/ToolManagement";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { format } from "date-fns";

// Heavy admin screens load only when their tab is opened.
const AdminInfluencers = lazy(() => import("@/pages/influencers/AdminInfluencers"));
const AdminDeveloperApps = lazy(() => import("@/pages/developer/AdminDeveloperApps"));
const AdminRefunds = lazy(() => import("@/pages/refunds/AdminRefunds"));
const AdminBulkQA = lazy(() => import("@/pages/AdminBulkQA"));
const AdminInstant = lazy(() => import("@/pages/instant/AdminInstant"));

const TAB_IDS = ["logs", "users", "credits", "tool-usage", "tool-mgmt", "groupings", "tool-demos", "promo-pages", "home-sections", "tool-requests", "archived-events", "meet-nudge", "api-keys", "analytics", "utm", "coupons", "card-promos", "virasat", "visitors", "tool-media", "enterprise", "seo-indexing", "data-export", "influencers", "app-review", "refunds", "bulk-qa", "instant"] as const;
type TabId = (typeof TAB_IDS)[number];

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
  // Paid website and card orders (ip_orders), split by what was bought.
  const [designSales, setDesignSales] = useState({ websites: { count: 0, inr: 0 }, cards: { count: 0, inr: 0 } });
  // The open section lives in the address (/admin?tab=influencers) so every admin screen has a link you can share or bookmark.
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get("tab") as TabId | null;
  // A clicked stat card opens its breakdown; it lives in the address too (/admin?stat=credits).
  const statParam = searchParams.get("stat") as StatKey | null;
  const openStat = statParam && STAT_KEYS.includes(statParam) ? statParam : null;
  const setOpenStat = (s: StatKey | null) => {
    const next = new URLSearchParams(searchParams);
    if (s) next.set("stat", s); else next.delete("stat");
    setSearchParams(next, { replace: true });
  };
  // Counted on the server so it is exact; the 200 newest logs below can miss logins on a busy day.
  const [todayLoginCount, setTodayLoginCount] = useState<number | null>(null);
  const [activeTab, setActiveTabState] = useState<TabId>(fromUrl && TAB_IDS.includes(fromUrl) ? fromUrl : "analytics");
  const setActiveTab = (t: TabId) => {
    setActiveTabState(t);
    setSearchParams({ tab: t }, { replace: true });
  };
  // (switching section clears ?stat, which closes the breakdown)
  useEffect(() => {
    if (fromUrl && TAB_IDS.includes(fromUrl)) setActiveTabState(fromUrl);
  }, [fromUrl]);

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
    const [logsRes, profilesRes, purchasesRes, ordersRes, productsRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("credit_purchases").select("credits, inr_amount").eq("status", "paid"),
      supabase.from("ip_orders").select("product_id, inr_amount").eq("status", "paid"),
      supabase.from("ip_products").select("id, category"),
    ]);
    if (ordersRes.data) {
      const categoryOf = new Map((productsRes.data ?? []).map((p) => [p.id, p.category]));
      const sales = { websites: { count: 0, inr: 0 }, cards: { count: 0, inr: 0 } };
      for (const o of ordersRes.data) {
        const bucket = (WEBSITE_CATEGORIES as readonly string[]).includes(categoryOf.get(o.product_id) ?? "") ? sales.websites : sales.cards;
        bucket.count += 1;
        bucket.inr += o.inr_amount || 0;
      }
      setDesignSales(sales);
    }
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const { count: loginsToday } = await supabase.from("activity_logs").select("id", { count: "exact", head: true }).eq("action_type", "login").gte("created_at", dayStart.toISOString());
    if (loginsToday !== null) setTodayLoginCount(loginsToday);
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
    todayLogins: todayLoginCount ?? logs.filter(l => l.action_type === "login" && new Date(l.created_at).toDateString() === new Date().toDateString()).length,
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

  const groups: { label: string; tabs: { id: TabId; label: string; icon: typeof Activity }[] }[] = [
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
        ...(!isViewOnly ? [{ id: "groupings" as const, label: "Groupings & Filters", icon: LayoutGrid }] : []),
        ...(!isViewOnly ? [{ id: "tool-demos" as const, label: "Demo Examples", icon: Sparkles }] : []),
        ...(!isViewOnly ? [{ id: "promo-pages" as const, label: "Promo Pages", icon: Rocket }] : []),
        { id: "tool-usage", label: "Tool Usage", icon: BarChart3 },
        ...(!isViewOnly ? [{ id: "tool-media" as const, label: "Tool Media", icon: ImageIcon }] : []),
        ...(!isViewOnly ? [{ id: "home-sections" as const, label: "Home Sections", icon: LayoutGrid }] : []),
        { id: "tool-requests", label: "Tool Requests", icon: MessageSquarePlus },
        ...(!isViewOnly ? [{ id: "bulk-qa" as const, label: "Bulk QA", icon: ListChecks }] : []),
      ],
    },
    ...(!isViewOnly
      ? [{
          label: "Store",
          tabs: [
            { id: "app-review" as const, label: "App review", icon: PackageCheck },
            { id: "instant" as const, label: "Websites & cards", icon: Store },
            { id: "refunds" as const, label: "Refunds", icon: Undo2 },
          ],
        }]
      : []),
    {
      label: "Growth",
      tabs: [
        ...(!isViewOnly ? [{ id: "utm" as const, label: "UTM Links", icon: LinkIcon }] : []),
        ...(!isViewOnly ? [{ id: "influencers" as const, label: "Influencers", icon: Megaphone }] : []),
        ...(!isViewOnly ? [{ id: "coupons" as const, label: "Coupons", icon: Ticket }] : []),
        ...(!isViewOnly ? [{ id: "card-promos" as const, label: "Gift cards", icon: Gift }] : []),
        { id: "enterprise", label: "Enterprise Leads", icon: Building2 },
        ...(!isViewOnly ? [{ id: "seo-indexing" as const, label: "SEO / Indexing", icon: Globe }] : []),
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
          tabs: [
            { id: "api-keys" as const, label: "API Keys", icon: KeyRound },
            { id: "data-export" as const, label: "Full Export", icon: Download },
          ],
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { key: "users" as StatKey, label: "Total Users", value: stats.totalUsers, icon: Users },
            { key: "credits" as StatKey, label: "Credits Sold", value: `${stats.creditsSold} (₹${stats.revenueInr})`, icon: Zap },
            { key: "websites" as StatKey, label: "Websites Sold", value: `${designSales.websites.count} (₹${designSales.websites.inr})`, icon: Globe },
            { key: "cards" as StatKey, label: "Cards Sold", value: `${designSales.cards.count} (₹${designSales.cards.inr})`, icon: Mail },
            { key: "logins" as StatKey, label: "Today's Logins", value: stats.todayLogins, icon: BarChart3 },
          ].map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setOpenStat(s.key)}
              aria-label={`${s.label}: open breakdown`}
              className="group text-left rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Card className="h-full cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <s.icon className="h-8 w-8 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
        <StatDrilldown stat={openStat} onClose={() => setOpenStat(null)} profiles={profiles} />

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          {/* Mobile: section dropdown */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
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
        {activeTab === "groupings" && !isViewOnly && <CategoriesManager />}
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
        {activeTab === "card-promos" && !isViewOnly && <CardPromoManager />}
        {activeTab === "tool-media" && !isViewOnly && <ToolMediaManager />}
        {activeTab === "enterprise" && <EnterpriseLeads />}
        {activeTab === "seo-indexing" && !isViewOnly && <AdminSeoIndexing />}
        {activeTab === "tool-demos" && !isViewOnly && <ToolDemoEditor />}
        {activeTab === "promo-pages" && !isViewOnly && <PromoPagesManager />}
        {activeTab === "data-export" && !isViewOnly && <DataExport />}
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
          {activeTab === "influencers" && !isViewOnly && <AdminInfluencers embedded />}
          {activeTab === "app-review" && !isViewOnly && <AdminDeveloperApps embedded />}
          {activeTab === "refunds" && !isViewOnly && <AdminRefunds embedded />}
          {activeTab === "bulk-qa" && !isViewOnly && <AdminBulkQA embedded />}
          {activeTab === "instant" && !isViewOnly && <AdminInstant embedded />}
        </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
