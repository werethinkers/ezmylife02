import type { AnalysisResult, StructuredData } from '../types';
import { ensureStartupLibs } from '@/lib/startupLibs';

const ANALYSER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/startup-analyser`;

/**
 * Calls the startup-analyser edge function with streaming to generate a comprehensive analysis.
 */
export async function generateComprehensiveAnalysis(
  companyName: string,
  companyWebsite: string,
  onProgress: (message: string) => void,
  pitchDeckText?: string | null,
  userApiKey?: string | null
): Promise<AnalysisResult> {
  onProgress('10');

  const body: Record<string, any> = {
    companyName: companyName.trim(),
    companyWebsite: companyWebsite.trim(),
  };
  if (pitchDeckText) {
    body.pitchDeckText = pitchDeckText.substring(0, 30000);
  }
  if (userApiKey) {
    body.userApiKey = userApiKey;
  }

  const resp = await fetch(ANALYSER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    if (resp.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
    if (resp.status === 402) throw new Error("Usage limit reached. Please add credits.");
    throw new Error(err.error || "Analysis failed");
  }

  if (!resp.body) throw new Error("No response body");

  onProgress('25');
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) fullContent += content;
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }

    const progress = Math.min(85, 25 + Math.floor(fullContent.length / 500));
    onProgress(String(progress));
  }

  onProgress('90');
  const result = parseAnalysisResponse(fullContent);
  
  if (!result.structuredData) {
    throw new Error("Failed to extract structured data from the AI's response. Please try again.");
  }
  
  onProgress('100');
  return result;
}

/**
 * Streams a chat message to the edge function and calls onDelta for each token.
 */
export async function streamChatMessage(
  reportContext: string,
  messages: { role: string; content: string }[],
  onDelta: (text: string) => void,
  onDone: () => void,
  userApiKey?: string | null
): Promise<void> {
  const resp = await fetch(ANALYSER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      action: "chat",
      reportContext,
      chatMessages: messages,
      ...(userApiKey ? { userApiKey } : {}),
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Chat failed");
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  onDone();
}

/**
 * Extract text from a PDF file using pdf.js (loaded via CDN).
 */
export async function extractPdfText(file: File): Promise<string> {
  await ensureStartupLibs();
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    pages.push(`--- Page ${i} ---\n${pageText}`);
  }

  return pages.join('\n\n');
}

// --- Response Parsing ---

function parseAnalysisResponse(fullText: string): AnalysisResult {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/s;
  const jsonMatch = fullText.match(jsonRegex);
  let markdownReport = fullText;
  let structuredData: StructuredData | null = null;
  let jsonString: string | null = null;

  if (jsonMatch && jsonMatch[1]) {
    jsonString = jsonMatch[1];
    markdownReport = fullText.replace(jsonRegex, '').trim();
  } else {
    const part2Marker = 'PART 2: JSON DATA';
    const part2Index = fullText.lastIndexOf(part2Marker);
    if (part2Index !== -1) {
      const potentialJson = fullText.substring(part2Index);
      const jsonStartIndex = potentialJson.indexOf('{');
      if (jsonStartIndex !== -1) {
        jsonString = potentialJson.substring(jsonStartIndex);
        markdownReport = fullText.substring(0, part2Index).trim();
      }
    }
  }

  if (jsonString) {
    try {
      structuredData = JSON.parse(jsonString);
    } catch {
      let repaired = jsonString
        .replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '')
        .trim();
      repaired = repaired.replace(/,(?=\s*[}\]])/g, '');

      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);

      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/]/g) || []).length;
      if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);

      repaired = repaired.replace(/,(?=\s*[}\]])/g, '');

      try {
        structuredData = JSON.parse(repaired);
      } catch {
        console.error("Failed to parse JSON even after repair.");
        structuredData = null;
      }
    }
  }

  if (structuredData) {
    structuredData = sanitizeAnalysisData(structuredData);
  }

  return { markdownReport, structuredData, sources: [], pitchDeckSummary: null };
}

// --- Data Sanitization ---

function sanitizeAnalysisData(data: any): StructuredData {
  if (!data) return data;

  const sanitizeCompetitor = (c: any = {}) => ({
    name: c.name || 'N/A',
    website: c.website || '',
    hq: c.hq || 'N/A',
    founding_year: c.founding_year || 'N/A',
    funding: c.funding || 'N/A',
    fundingAmount: typeof c.fundingAmount === 'string'
      ? parseFloat(c.fundingAmount.replace(/[^0-9.-]+/g, "")) || 0
      : c.fundingAmount || 0,
    valuation: c.valuation || 'N/A',
    key_investors: Array.isArray(c.key_investors) ? c.key_investors : [],
    notable_clients: Array.isArray(c.notable_clients) ? c.notable_clients : [],
    recent_moves: c.recent_moves || 'N/A',
    core_product: c.core_product || 'N/A',
    tech_advantage: c.tech_advantage || 'N/A',
    user_co_advantage: c.user_co_advantage || 'N/A',
  });

  const sanitizeChartData = (chart: any) => {
    if (!chart) return { type: 'bar' as const, labels: [], datasets: [] };
    chart.labels = Array.isArray(chart.labels) ? chart.labels : [];
    chart.datasets = Array.isArray(chart.datasets) ? chart.datasets : [];
    chart.datasets.forEach((dataset: any) => {
      if (dataset?.data) {
        dataset.data = (Array.isArray(dataset.data) ? dataset.data : [])
          .map((d: any) => {
            if (d === null) return null;
            const num = parseFloat(String(d).replace(/[^0-9.-]+/g, ""));
            return isNaN(num) ? null : num;
          });
      }
    });
    return chart;
  };

  const sanitizeSourcedDataArray = (arr: any) => {
    if (Array.isArray(arr) && arr.length > 0) return arr;
    return [{ value: "Information not publicly available", sourceType: "model_knowledge", sourceDetail: "N/A" }];
  };

  data.indian_competitors = Array.isArray(data.indian_competitors) ? data.indian_competitors.map(sanitizeCompetitor) : [];
  data.global_competitors = Array.isArray(data.global_competitors) ? data.global_competitors.map(sanitizeCompetitor) : [];

  data.indian_competitor_chart_data = sanitizeChartData(data.indian_competitor_chart_data);
  data.global_competitor_chart_data = sanitizeChartData(data.global_competitor_chart_data);
  data.market_size_chart_data = sanitizeChartData(data.market_size_chart_data);
  data.market_subcategory_share_chart_data = sanitizeChartData(data.market_subcategory_share_chart_data);
  data.market_subcategory_growth_chart_data = sanitizeChartData(data.market_subcategory_growth_chart_data);

  data.news_articles = Array.isArray(data.news_articles) ? data.news_articles : [];
  data.youtube_videos = Array.isArray(data.youtube_videos) ? data.youtube_videos : [];
  data.research_papers = Array.isArray(data.research_papers) ? data.research_papers : [];

  data.keywords = data.keywords || { business: [], technical: [] };
  data.keywords.business = Array.isArray(data.keywords.business) ? data.keywords.business : [];
  data.keywords.technical = Array.isArray(data.keywords.technical) ? data.keywords.technical : [];

  const sourcedFields = [
    'market_analysis', 'problem_in_detail', 'solution_in_detail', 'products_analysis',
    'pictorial_technology_definition', 'usp_moat', 'ip_summary', 'competition_summary',
    'traction_summary', 'business_model', 'team_summary', 'fundraises_summary',
    'investment_required', 'use_of_investments', 'financial_plan_summary', 'expert_opinion',
    'exit_plan_summary', 'investment_risk', 'investment_rationale', 'conclusion', 'future_roadmap',
  ];
  sourcedFields.forEach(field => { data[field] = sanitizeSourcedDataArray(data[field]); });

  data.financial_projections = data.financial_projections || { headers: [], rows: [], source: { sourceType: 'model_knowledge', sourceDetail: 'N/A' } };
  data.financial_projections.headers = Array.isArray(data.financial_projections.headers) ? data.financial_projections.headers : [];
  data.financial_projections.rows = (Array.isArray(data.financial_projections.rows) ? data.financial_projections.rows : []).map((row: any) => {
    if (!row) return null;
    return {
      metric: row.metric || 'N/A',
      values: (Array.isArray(row.values) ? row.values : []).map((v: any) => {
        if (v === null) return null;
        const num = parseFloat(String(v).replace(/[^0-9.-]+/g, ""));
        return isNaN(num) ? null : num;
      }),
    };
  }).filter(Boolean);

  data.comparisonMatrix = data.comparisonMatrix || { headers: [], rows: [] };
  data.fundingTrends = data.fundingTrends || '';

  data.executiveSummaryData = data.executiveSummaryData || {};

  data.executiveSummaryData.startup_overview = data.executiveSummaryData.startup_overview || {};
  data.executiveSummaryData.product_market_fit = data.executiveSummaryData.product_market_fit || {};
  data.executiveSummaryData.product_market_fit.history_of_tech_in_india = sanitizeSourcedDataArray(data.executiveSummaryData.product_market_fit.history_of_tech_in_india);
  data.executiveSummaryData.financial_snapshot = data.executiveSummaryData.financial_snapshot || {};
  data.executiveSummaryData.competitive_landscape = data.executiveSummaryData.competitive_landscape || {};

  data.executiveSummaryData.deal_evaluation = data.executiveSummaryData.deal_evaluation || {};
  data.executiveSummaryData.deal_evaluation.potential_failure_points = sanitizeSourcedDataArray(data.executiveSummaryData.deal_evaluation.potential_failure_points);

  data.executiveSummaryData.deal_evaluation.exit_options_ipo = (Array.isArray(data.executiveSummaryData.deal_evaluation.exit_options_ipo) ? data.executiveSummaryData.deal_evaluation.exit_options_ipo : []).map((ipo: any) => {
    if (!ipo) return null;
    return { company_name: sanitizeSourcedDataArray(ipo.company_name), year: sanitizeSourcedDataArray(ipo.year) };
  }).filter(Boolean);

  data.executiveSummaryData.deal_evaluation.exit_options_acquisition = (Array.isArray(data.executiveSummaryData.deal_evaluation.exit_options_acquisition) ? data.executiveSummaryData.deal_evaluation.exit_options_acquisition : []).map((acq: any) => {
    if (!acq) return null;
    return { company_name: sanitizeSourcedDataArray(acq.company_name), acquirer: sanitizeSourcedDataArray(acq.acquirer), year: sanitizeSourcedDataArray(acq.year) };
  }).filter(Boolean);

  data.executiveSummaryData.deal_evaluation.exit_options_secondary_sale = (Array.isArray(data.executiveSummaryData.deal_evaluation.exit_options_secondary_sale) ? data.executiveSummaryData.deal_evaluation.exit_options_secondary_sale : []).map((sale: any) => {
    if (!sale) return null;
    return { details: sanitizeSourcedDataArray(sale.details) };
  }).filter(Boolean);

  data.executiveSummaryData.team = data.executiveSummaryData.team || { founders: [], team_gaps: [] };
  data.executiveSummaryData.team.founders = (Array.isArray(data.executiveSummaryData.team.founders) ? data.executiveSummaryData.team.founders : []).map((founder: any) => {
    if (!founder) return null;
    founder.name = sanitizeSourcedDataArray(founder.name);
    founder.title = sanitizeSourcedDataArray(founder.title);
    founder.background = sanitizeSourcedDataArray(founder.background);
    founder.linkedin_url = sanitizeSourcedDataArray(founder.linkedin_url);
    founder.other_positions = (Array.isArray(founder.other_positions) ? founder.other_positions : []).map((pos: any) => {
      if (!pos) return null;
      return {
        company_name: sanitizeSourcedDataArray(pos.company_name),
        company_details: sanitizeSourcedDataArray(pos.company_details),
        position_held: sanitizeSourcedDataArray(pos.position_held),
      };
    }).filter(Boolean);
    return founder;
  }).filter(Boolean);

  data.executiveSummaryData.legal_analysis = data.executiveSummaryData.legal_analysis || { founder_legal_issues: [], company_legal_issues: [] };
  data.executiveSummaryData.legal_analysis.founder_legal_issues = sanitizeSourcedDataArray(data.executiveSummaryData.legal_analysis.founder_legal_issues);
  data.executiveSummaryData.legal_analysis.company_legal_issues = sanitizeSourcedDataArray(data.executiveSummaryData.legal_analysis.company_legal_issues);

  return data as StructuredData;
}
