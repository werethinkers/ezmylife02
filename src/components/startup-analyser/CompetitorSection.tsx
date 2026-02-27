import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Calendar, DollarSign, Users, Briefcase } from "lucide-react";
import type { Competitor } from "@/types/startupAnalyser";

interface CompetitorSectionProps {
  indian: Competitor[];
  global: Competitor[];
}

const CompetitorCard = ({ competitor }: { competitor: Competitor }) => (
  <Card className="border-border/50">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm">{competitor.name}</h4>
          {competitor.website && (
            <a href={competitor.website.startsWith("http") ? competitor.website : `https://${competitor.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              <Globe className="h-3 w-3" />{competitor.website}
            </a>
          )}
        </div>
        <Badge variant="outline" className="text-xs">{competitor.founding_year || "N/A"}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />{competitor.hq || "Unknown"}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <DollarSign className="h-3 w-3" />{competitor.funding || "N/A"}
        </div>
      </div>
      {competitor.valuation && (
        <div className="text-xs"><span className="font-medium">Valuation:</span> {competitor.valuation}</div>
      )}
      {competitor.core_product && (
        <div className="text-xs"><span className="font-medium">Core Product:</span> {competitor.core_product}</div>
      )}
      {competitor.tech_advantage && (
        <div className="text-xs"><span className="font-medium">Tech Edge:</span> {competitor.tech_advantage}</div>
      )}
      {competitor.user_co_advantage && (
        <div className="text-xs text-primary"><span className="font-medium">Our Advantage:</span> {competitor.user_co_advantage}</div>
      )}
      {competitor.key_investors?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {competitor.key_investors.slice(0, 3).map((inv, i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">{inv}</Badge>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export const CompetitorSection = ({ indian, global }: CompetitorSectionProps) => (
  <div className="space-y-6">
    {indian.length > 0 && (
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Indian Competitors ({indian.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {indian.map((c, i) => <CompetitorCard key={i} competitor={c} />)}
        </div>
      </div>
    )}
    {global.length > 0 && (
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Global Competitors ({global.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {global.map((c, i) => <CompetitorCard key={i} competitor={c} />)}
        </div>
      </div>
    )}
    {indian.length === 0 && global.length === 0 && (
      <Card className="p-6"><p className="text-muted-foreground text-center">No competitor data available.</p></Card>
    )}
  </div>
);
