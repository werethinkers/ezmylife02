export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Competitor {
  name: string;
  website: string;
  hq: string;
  founding_year: string;
  funding: string;
  fundingAmount: number;
  valuation: string;
  key_investors: string[];
  notable_clients: string[];
  recent_moves: string;
  core_product: string;
  tech_advantage: string;
  user_co_advantage: string;
}

export interface ChartData {
  type: "bar" | "pie" | "line" | "donut";
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

export type SourceType = "pitch_deck" | "web_search" | "model_knowledge";

export interface SourcedDataPoint {
  value: string;
  sourceType: SourceType;
  sourceDetail: string;
}

export interface ResourceItem {
  title: string;
  url: string;
  summary: string;
  type: "news" | "youtube" | "paper";
}

export interface FounderDetail {
  name: SourcedDataPoint[];
  title: SourcedDataPoint[];
  background: SourcedDataPoint[];
  linkedin_url: SourcedDataPoint[];
}

export interface ExecutiveSummaryData {
  startup_overview: {
    name: SourcedDataPoint[];
    website: SourcedDataPoint[];
    founding_year: SourcedDataPoint[];
    location: SourcedDataPoint[];
    sector_subsector: SourcedDataPoint[];
    stage: SourcedDataPoint[];
  };
  product_market_fit: {
    brief_overview: SourcedDataPoint[];
    problem: SourcedDataPoint[];
    solution: SourcedDataPoint[];
    unique_selling_point: SourcedDataPoint[];
    target_customer: SourcedDataPoint[];
    market_size: SourcedDataPoint[];
  };
  financial_snapshot: {
    revenue_mrr_arr: SourcedDataPoint[];
    use_of_funds: SourcedDataPoint[];
  };
  team: {
    founders: FounderDetail[];
    team_gaps: SourcedDataPoint[];
  };
  competitive_landscape: {
    key_competitors_summary: SourcedDataPoint[];
  };
  deal_evaluation: {
    strengths: SourcedDataPoint[];
    risks_concerns: SourcedDataPoint[];
    vc_fit: SourcedDataPoint[];
    next_action: SourcedDataPoint[];
  };
  legal_analysis: {
    founder_legal_issues: SourcedDataPoint[];
    company_legal_issues: SourcedDataPoint[];
  };
}

export interface StructuredData {
  name: string;
  website: string;
  industry: string;
  description: string;
  founded_year: string;
  location: string;
  market_analysis: SourcedDataPoint[];
  problem_in_detail: SourcedDataPoint[];
  solution_in_detail: SourcedDataPoint[];
  products_analysis: SourcedDataPoint[];
  usp_moat: SourcedDataPoint[];
  ip_summary: SourcedDataPoint[];
  competition_summary: SourcedDataPoint[];
  traction_summary: SourcedDataPoint[];
  business_model: SourcedDataPoint[];
  team_summary: SourcedDataPoint[];
  fundraises_summary: SourcedDataPoint[];
  investment_required: SourcedDataPoint[];
  use_of_investments: SourcedDataPoint[];
  financial_plan_summary: SourcedDataPoint[];
  expert_opinion: SourcedDataPoint[];
  exit_plan_summary: SourcedDataPoint[];
  investment_risk: SourcedDataPoint[];
  investment_rationale: SourcedDataPoint[];
  conclusion: SourcedDataPoint[];
  future_roadmap: SourcedDataPoint[];
  keywords: { business: string[]; technical: string[] };
  news_articles: ResourceItem[];
  youtube_videos: ResourceItem[];
  research_papers: ResourceItem[];
  indian_competitors: Competitor[];
  global_competitors: Competitor[];
  indian_competitor_chart_data: ChartData;
  global_competitor_chart_data: ChartData;
  market_size_chart_data: ChartData;
  executiveSummaryData: ExecutiveSummaryData;
}

export interface AnalysisResult {
  markdownReport: string;
  structuredData: StructuredData | null;
}

export interface SavedAnalysis {
  id: string;
  company_name: string;
  company_website: string | null;
  analysis_data: AnalysisResult;
  markdown_report: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
