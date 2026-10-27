import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronUp, User, LogIn, UserPlus, Wrench, CreditCard, Pencil } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from "date-fns";

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
}

interface ActivityArchiveProps {
  logs: ActivityLog[];
  profiles: Profile[];
}

const ACTION_TYPES = ["all", "tool_usage", "login", "signup", "profile_edit", "payment", "subscription"];

export const ACTION_CONFIG: Record<string, { icon: typeof User; color: string; label: string }> = {
  login: { icon: LogIn, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Login" },
  signup: { icon: UserPlus, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Signup" },
  tool_usage: { icon: Wrench, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Tool Used" },
  profile_edit: { icon: Pencil, color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Profile Edit" },
  payment: { icon: CreditCard, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Payment" },
  subscription: { icon: CreditCard, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Subscription" },
};

export const getHumanDescription = (log: ActivityLog): string => {
  const details = log.action_details as Record<string, unknown> | null;
  switch (log.action_type) {
    case "tool_usage":
      return `Used ${(details?.tool_name as string) || (details?.tool_id as string) || "a tool"}`;
    case "login":
      return `Logged in via ${(details?.provider as string) || "email"}`;
    case "signup":
      return `Signed up via ${(details?.provider as string) || "email"}`;
    case "profile_edit": {
      const fields = details?.changed_fields as string[] | undefined;
      return fields?.length ? `Updated ${fields.join(", ")}` : "Updated profile";
    }
    case "payment":
      return `Made a payment${details?.plan ? ` for ${details.plan}` : ""}`;
    case "subscription":
      return `Subscription ${(details?.action as string) || "updated"}`;
    default:
      return log.action_type.replace(/_/g, " ");
  }
};

const groupByDate = (logs: ActivityLog[]): { label: string; logs: ActivityLog[] }[] => {
  const groups: Record<string, ActivityLog[]> = {};
  const order: string[] = [];

  logs.forEach(log => {
    const date = new Date(log.created_at);
    let label: string;
    if (isToday(date)) label = "Today";
    else if (isYesterday(date)) label = "Yesterday";
    else if (isThisWeek(date)) label = "This Week";
    else label = format(date, "MMMM d, yyyy");

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(log);
  });

  return order.map(label => ({ label, logs: groups[label] }));
};

const ActivityArchive = ({ logs, profiles }: ActivityArchiveProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach(p => map.set(p.id, p));
    return map;
  }, [profiles]);

  const getUserLabel = (userId: string) => {
    const p = profileMap.get(userId);
    return p?.email || p?.display_name || p?.full_name || userId.slice(0, 8);
  };

  const getUserInitials = (userId: string) => {
    const p = profileMap.get(userId);
    const name = p?.full_name || p?.display_name || p?.email || "";
    return name.slice(0, 2).toUpperCase() || "??";
  };

  const filtered = useMemo(() => {
    let result = logs;
    if (filter !== "all") result = result.filter(l => l.action_type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l => {
        const user = getUserLabel(l.user_id).toLowerCase();
        const desc = getHumanDescription(l).toLowerCase();
        return user.includes(q) || desc.includes(q) || l.action_type.includes(q);
      });
    }
    return result;
  }, [logs, filter, search, profileMap]);

  const visible = filtered.slice(0, visibleCount);
  const groups = groupByDate(visible);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ACTION_TYPES.map(t => (
            <Button
              key={t}
              size="sm"
              variant={filter === t ? "default" : "outline"}
              onClick={() => setFilter(t)}
              className="text-xs capitalize"
            >
              {t === "all" ? "All" : t.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Grouped Logs */}
      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No activity logs found</div>
      )}

      {groups.map(group => (
        <div key={group.label} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.label}</h3>
          <div className="space-y-1.5">
            {group.logs.map(log => {
              const config = ACTION_CONFIG[log.action_type] || { icon: User, color: "bg-muted text-muted-foreground border-border", label: log.action_type };
              const IconComp = config.icon;
              const expanded = expandedIds.has(log.id);

              return (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0">
                        {getUserInitials(log.user_id)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{getUserLabel(log.user_id)}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                            <IconComp className="h-2.5 w-2.5 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{getHumanDescription(log)}</p>
                      </div>

                      {/* Time + expand */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.action_details && (
                          <button onClick={() => toggleExpand(log.id)} className="p-1 hover:bg-muted rounded">
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expanded && log.action_details && (
                      <pre className="mt-2 p-2 rounded bg-muted text-[10px] text-muted-foreground overflow-x-auto max-h-40">
                        {JSON.stringify(log.action_details, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount(v => v + 50)}>
            Load more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityArchive;
