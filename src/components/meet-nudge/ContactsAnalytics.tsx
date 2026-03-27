import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, MapPin, Briefcase, TrendingUp, Mail } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  occupation?: string | null;
  business_name?: string | null;
  location?: string | null;
  event_name?: string | null;
  event_id?: string | null;
  intro_sent?: boolean;
  created_at: string;
}

interface ContactsAnalyticsProps {
  contacts: Contact[];
}

const ContactsAnalytics = ({ contacts }: ContactsAnalyticsProps) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = contacts.filter(c => {
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const introsSent = contacts.filter(c => c.intro_sent).length;

    // Top companies
    const companyCounts: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.business_name) {
        const key = c.business_name.trim();
        companyCounts[key] = (companyCounts[key] || 0) + 1;
      }
    });
    const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Top locations
    const locationCounts: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.location) {
        const key = c.location.trim();
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Top occupations
    const occupationCounts: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.occupation) {
        const key = c.occupation.trim();
        occupationCounts[key] = (occupationCounts[key] || 0) + 1;
      }
    });
    const topOccupations = Object.entries(occupationCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Contacts per event
    const eventCounts: Record<string, number> = {};
    contacts.forEach(c => {
      const key = c.event_name || "Unknown Event";
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    });
    const perEvent = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]);

    // Recent contacts
    const recent = [...contacts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return { thisMonth: thisMonth.length, introsSent, topCompanies, topLocations, topOccupations, perEvent, recent, uniqueEvents: Object.keys(eventCounts).length };
  }, [contacts]);

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No contacts yet</p>
        <p className="text-sm">Start adding contacts from your events to see insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Contacts", value: contacts.length, icon: Users, color: "text-blue-500" },
          { label: "Events", value: analytics.uniqueEvents, icon: TrendingUp, color: "text-green-500" },
          { label: "Intros Sent", value: `${contacts.length > 0 ? Math.round((analytics.introsSent / contacts.length) * 100) : 0}%`, icon: Mail, color: "text-purple-500" },
          { label: "This Month", value: analytics.thisMonth, icon: TrendingUp, color: "text-orange-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contacts per Event */}
      {analytics.perEvent.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contacts per Event</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analytics.perEvent.map(([name, count]) => {
              const maxCount = analytics.perEvent[0][1] as number;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate max-w-[200px]">{name}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Top Companies */}
        {analytics.topCompanies.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Building className="h-4 w-4" /> Top Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topCompanies.map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name} <span className="ml-1 opacity-60">({count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Locations */}
        {analytics.topLocations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topLocations.map(([name, count]) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name} <span className="ml-1 opacity-60">({count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Roles */}
        {analytics.topOccupations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" /> Top Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {analytics.topOccupations.map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name} <span className="ml-1 opacity-60">({count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Contacts */}
      {analytics.recent.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Contacts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {analytics.recent.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.occupation || c.business_name || "—"}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactsAnalytics;
