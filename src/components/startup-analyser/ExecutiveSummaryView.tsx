import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Target, TrendingUp, Users, Shield, Scale, AlertTriangle, CheckCircle } from "lucide-react";
import type { ExecutiveSummaryData, SourcedDataPoint } from "@/types/startupAnalyser";

interface ExecutiveSummaryViewProps {
  data: ExecutiveSummaryData;
  companyName: string;
}

const DataPointList = ({ points, icon }: { points?: SourcedDataPoint[]; icon?: React.ReactNode }) => {
  if (!points || points.length === 0) return <p className="text-xs text-muted-foreground italic">Not available</p>;
  return (
    <ul className="space-y-1">
      {points.map((p, i) => (
        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
          {icon || <span className="text-primary mt-1">•</span>}
          <span>{p.value}</span>
        </li>
      ))}
    </ul>
  );
};

const SummaryCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Card className="border-border/50">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">{icon}{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">{children}</CardContent>
  </Card>
);

export const ExecutiveSummaryView = ({ data, companyName }: ExecutiveSummaryViewProps) => {
  if (!data) return <Card className="p-6"><p className="text-muted-foreground">No executive summary data.</p></Card>;

  const { startup_overview, product_market_fit, financial_snapshot, team, competitive_landscape, deal_evaluation, legal_analysis } = data;

  return (
    <div className="space-y-4">
      {/* Overview */}
      <SummaryCard title={`${companyName} Overview`} icon={<Building2 className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {startup_overview?.founding_year && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Founded</p>
              <p className="text-sm">{startup_overview.founding_year[0]?.value || "N/A"}</p>
            </div>
          )}
          {startup_overview?.location && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Location</p>
              <p className="text-sm">{startup_overview.location[0]?.value || "N/A"}</p>
            </div>
          )}
          {startup_overview?.sector_subsector && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Sector</p>
              <p className="text-sm">{startup_overview.sector_subsector[0]?.value || "N/A"}</p>
            </div>
          )}
          {startup_overview?.stage && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Stage</p>
              <Badge variant="outline" className="text-xs">{startup_overview.stage[0]?.value || "N/A"}</Badge>
            </div>
          )}
        </div>
      </SummaryCard>

      {/* Product-Market Fit */}
      <SummaryCard title="Product-Market Fit" icon={<Target className="h-4 w-4 text-primary" />}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold mb-1">Overview</p>
            <DataPointList points={product_market_fit?.brief_overview} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-1">Problem</p>
              <DataPointList points={product_market_fit?.problem} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Solution</p>
              <DataPointList points={product_market_fit?.solution} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">USP</p>
            <DataPointList points={product_market_fit?.unique_selling_point} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">Market Size</p>
            <DataPointList points={product_market_fit?.market_size} />
          </div>
        </div>
      </SummaryCard>

      {/* Financial & Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Financial Snapshot" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
          <div>
            <p className="text-xs font-semibold mb-1">Revenue</p>
            <DataPointList points={financial_snapshot?.revenue_mrr_arr} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">Use of Funds</p>
            <DataPointList points={financial_snapshot?.use_of_funds} />
          </div>
        </SummaryCard>

        <SummaryCard title="Team" icon={<Users className="h-4 w-4 text-primary" />}>
          {team?.founders?.map((f, i) => (
            <div key={i} className="border-b border-border/50 pb-2 last:border-0">
              <p className="text-sm font-medium">{f.name?.[0]?.value || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{f.title?.[0]?.value || ""}</p>
            </div>
          ))}
          <div>
            <p className="text-xs font-semibold mb-1">Team Gaps</p>
            <DataPointList points={team?.team_gaps} />
          </div>
        </SummaryCard>
      </div>

      {/* Deal Evaluation */}
      <SummaryCard title="Deal Evaluation" icon={<Scale className="h-4 w-4 text-primary" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold mb-1 flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Strengths</p>
            <DataPointList points={deal_evaluation?.strengths} />
          </div>
          <div>
            <p className="text-xs font-semibold mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-yellow-500" />Risks</p>
            <DataPointList points={deal_evaluation?.risks_concerns} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">VC Fit</p>
          <DataPointList points={deal_evaluation?.vc_fit} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Next Actions</p>
          <DataPointList points={deal_evaluation?.next_action} />
        </div>
      </SummaryCard>

      {/* Legal */}
      {legal_analysis && (
        <SummaryCard title="Legal Analysis" icon={<Shield className="h-4 w-4 text-primary" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-1">Founder Issues</p>
              <DataPointList points={legal_analysis.founder_legal_issues} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Company Issues</p>
              <DataPointList points={legal_analysis.company_legal_issues} />
            </div>
          </div>
        </SummaryCard>
      )}
    </div>
  );
};
