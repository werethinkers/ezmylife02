import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Activity, Crown, BarChart3 } from "lucide-react";
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
  auth_provider: string | null;
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
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<PremiumAccess[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "premium">("logs");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
      setChecking(false);
      fetchData();
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    const [logsRes, profilesRes, premiumRes] = await Promise.all([
      supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("premium_access").select("*").order("granted_at", { ascending: false }),
    ]);
    if (logsRes.data) setLogs(logsRes.data as ActivityLog[]);
    if (profilesRes.data) setProfiles(profilesRes.data);
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

  const tabs = [
    { id: "logs" as const, label: "Activity Logs", icon: Activity },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "premium" as const, label: "Premium", icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
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

        {/* Activity Logs */}
        {activeTab === "logs" && (
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">{getEmailForUser(log.user_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionTypeColor(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                        {log.action_details ? JSON.stringify(log.action_details) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No activity logs yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <Card>
            <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.email || "—"}</TableCell>
                      <TableCell className="text-sm">{p.display_name || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{p.auth_provider || "email"}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Premium */}
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
                  {premiumUsers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No premium users</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
