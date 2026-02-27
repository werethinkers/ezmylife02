export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface Competitor {
    name: string;
    website: string;
    hq: string;
    founding_year: string;
    funding: string;
    fundingAmount: number; // For charting. 0 if not applicable/found.
    valuation: string;
    key_investors: string[];
    notable_clients: string[];
    recent_moves: string;
    core_product: string;
    tech_advantage: string;
    user_co_advantage: string;
}

export interface ComparisonMatrix {
    headers: string[];
    rows: string[][];
}

export interface ChartData {
    type: 'bar' | 'pie' | 'line' | 'donut';
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

export type SourceType = 'pitch_deck' | 'web_search' | 'model_knowledge';

export interface SourcedDataPoint {
    value: string;
    sourceType: SourceType;
    sourceDetail: string; // URL, "Slide 5", "N/A"
}

export interface ResourceItem {
    title: string;
    url: string;
    summary: string;
    type: 'news' | 'youtube' | 'paper';
}

export interface OtherPosition {
    company_name: SourcedDataPoint[];
    company_details: SourcedDataPoint[];
    position_held: SourcedDataPoint[];
}

export interface FounderDetail {
    name: SourcedDataPoint[];
    title: SourcedDataPoint[];
    background: SourcedDataPoint[];
    linkedin_url: SourcedDataPoint[];
    other_positions: OtherPosition[];
}

export interface IPOExample {
    company_name: SourcedDataPoint[];
    year: SourcedDataPoint[];
}

export interface AcquisitionExample {
    company_name: SourcedDataPoint[];
    acquirer: SourcedDataPoint[];
    year: SourcedDataPoint[];
}

export interface SecondarySaleExample {
    details: SourcedDataPoint[];
}

export interface FinancialProjectionRow {
    metric: string;
    values: (number | null)[];
}

export interface FinancialProjections {
    headers: string[];
    rows: FinancialProjectionRow[];
    source: {
        sourceType: SourceType;
        sourceDetail: string;
    }
}

export interface ExecutiveSummaryData {
    startup_overview: {
        name: SourcedDataPoint[];
        website: SourcedDataPoint[];
        founding_year: SourcedDataPoint[];
        location: SourcedDataPoint[];
        sector_subsector: SourcedDataPoint[];
        investment_ask: SourcedDataPoint[];
        investment_committed: SourcedDataPoint[];
        investment_remaining: SourcedDataPoint[];
        stage: SourcedDataPoint[];
        date_of_review: SourcedDataPoint[];
        author_name: SourcedDataPoint[];
    };
    product_market_fit: {
        brief_overview: SourcedDataPoint[];
        definition_of_tech: SourcedDataPoint[];
        problem: SourcedDataPoint[];
        products_being_sold: SourcedDataPoint[];
        solution: SourcedDataPoint[];
        unique_selling_point: SourcedDataPoint[];
        product_ip_defense: SourcedDataPoint[];
        target_customer: SourcedDataPoint[];
        market_size: SourcedDataPoint[];
        history_of_tech_in_india: SourcedDataPoint[];
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
        potential_failure_points: SourcedDataPoint[];
        exit_options_ipo: IPOExample[];
        exit_options_acquisition: AcquisitionExample[];
        exit_options_secondary_sale: SecondarySaleExample[];
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
    
    // Detailed IC Note Content
    market_analysis: SourcedDataPoint[];
    problem_in_detail: SourcedDataPoint[];
    solution_in_detail: SourcedDataPoint[];
    products_analysis: SourcedDataPoint[];
    pictorial_technology_definition: SourcedDataPoint[];
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

    // Keywords and Resources
    keywords: {
        business: string[];
        technical: string[];
    };
    news_articles: ResourceItem[];
    youtube_videos: ResourceItem[];
    research_papers: ResourceItem[];

    // Competitors and Charts
    indian_competitors: Competitor[];
    global_competitors: Competitor[];
    indian_competitor_chart_data: ChartData;
    global_competitor_chart_data: ChartData;
    market_size_chart_data: ChartData;
    market_subcategory_share_chart_data: ChartData;
    market_subcategory_growth_chart_data: ChartData;
    comparisonMatrix: ComparisonMatrix;
    fundingTrends: string;

    // Financial Projections
    financial_projections: FinancialProjections;

    // Ultra-detailed Executive Summary
    executiveSummaryData: ExecutiveSummaryData;
}


export interface AnalysisResult {
  markdownReport: string;
  structuredData: StructuredData | null;
  sources: { uri: string; title: string }[];
  pitchDeckSummary: string | null;
}

export interface Prompt {
  title: string;
  description: string;
  text: string;
}

export interface Company {
  name: string;
  website: string;
  pitchDeckUrl: string;
}