import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, companyWebsite, action, reportContext, chatMessages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Chat action - follow-up questions about an existing analysis
    if (action === "chat") {
      const systemPrompt = `You are an expert AI investment analyst assistant. The user has received an analysis report for a startup. Answer follow-up questions based on this context:\n\n${(reportContext || "").substring(0, 4000)}\n\nBe concise and helpful.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...(chatMessages || []),
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }

      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Main analysis action
    if (!companyName) throw new Error("Company name is required");

    const analysisPrompt = getAnalysisPrompt(companyName, companyWebsite || "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "You are a world-class venture capital analyst. Generate exhaustive, detailed investment analysis reports. Always respond with the exact structure requested." },
          { role: "user", content: analysisPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("startup-analyser error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAnalysisPrompt(companyName: string, companyWebsite: string): string {
  return `Generate a comprehensive Investment Committee (IC) Note for the startup "${companyName}" (${companyWebsite || "website unknown"}).

**CRITICAL DIRECTIVE: BE EXHAUSTIVE.** Generate content for every single heading below. If information is not available, explicitly state "Information not publicly available".

Structure your response into two distinct parts: a detailed markdown report and a structured JSON object.

**PART 1: MARKDOWN REPORT (IC NOTE FORMAT)**

# IC NOTE: ${companyName}
- **Website**: ${companyWebsite || "N/A"}
- **Industry**:
- **Description**:
- **Year Of Foundation**:

## Executive Summary

## Market
- **History Of This Tech In India**:
- **Market Size & TAM/SAM/SOM**:
- **Market Overview Across all verticals**:
- **Market Challenges**:

## Problem
- **Problem In Detail**:

## Solution
- **Solution In Detail**:

## Products & Technology
- **Products Analysis**:
- **USP / MOAT**:
- **Intellectual Property**:

## Competition
### Indian Competitors
| Company | Website | HQ | Funding | Valuation | Core Product | Tech Advantage | Our Advantage |
|---|---|---|---|---|---|---|---|

### Global Competitors
| Company | Website | HQ | Funding | Valuation | Core Product | Tech Advantage | Our Advantage |
|---|---|---|---|---|---|---|---|

## Traction

## Business Model

## Team
### Founders

## Fundraising History

## Financial Plan
### Investment Required
### Use of Investments
### Financial Projections

## Expert Opinion

## Exit Plan

## Investment Risk

## Investment Rationale

## Conclusion

## Future Roadmap

## Legal & Compliance
### Founder Legal Issues
### Company Legal Issues

**PART 2: JSON DATA**
After the markdown report, include a single JSON object enclosed in \`\`\`json ... \`\`\`.

The JSON must follow this exact structure:
\`\`\`json
{
  "name": "${companyName}",
  "website": "${companyWebsite || ""}",
  "industry": "string",
  "description": "string",
  "founded_year": "string",
  "location": "string",
  "market_analysis": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "problem_in_detail": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "solution_in_detail": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "products_analysis": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "usp_moat": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "ip_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "competition_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "traction_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "business_model": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "team_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "fundraises_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "investment_required": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "use_of_investments": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "financial_plan_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": "string"}],
  "expert_opinion": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "exit_plan_summary": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "investment_risk": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "investment_rationale": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "conclusion": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "future_roadmap": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": "string"}],
  "keywords": {
    "business": ["keyword1", "keyword2"],
    "technical": ["keyword1", "keyword2"]
  },
  "news_articles": [{"title": "string", "url": "string", "summary": "string", "type": "news"}],
  "youtube_videos": [{"title": "string", "url": "string", "summary": "string", "type": "youtube"}],
  "research_papers": [{"title": "string", "url": "string", "summary": "string", "type": "paper"}],
  "indian_competitors": [
    {"name": "string", "website": "string", "hq": "string", "founding_year": "string", "funding": "string", "fundingAmount": 0, "valuation": "string", "key_investors": [], "notable_clients": [], "recent_moves": "string", "core_product": "string", "tech_advantage": "string", "user_co_advantage": "string"}
  ],
  "global_competitors": [
    {"name": "string", "website": "string", "hq": "string", "founding_year": "string", "funding": "string", "fundingAmount": 0, "valuation": "string", "key_investors": [], "notable_clients": [], "recent_moves": "string", "core_product": "string", "tech_advantage": "string", "user_co_advantage": "string"}
  ],
  "indian_competitor_chart_data": {
    "type": "bar",
    "labels": ["Company1", "Company2"],
    "datasets": [{"label": "Funding ($M)", "data": [10, 20], "backgroundColor": ["#FF6384", "#36A2EB"]}]
  },
  "global_competitor_chart_data": {
    "type": "bar",
    "labels": ["Company1", "Company2"],
    "datasets": [{"label": "Funding ($M)", "data": [10, 20], "backgroundColor": ["#FF6384", "#36A2EB"]}]
  },
  "market_size_chart_data": {
    "type": "line",
    "labels": ["2024", "2025", "2026", "2027", "2028"],
    "datasets": [{"label": "TAM", "data": [100, 120, 150, 180, 220], "borderColor": "#FF6384", "fill": false, "tension": 0.4}]
  },
  "executiveSummaryData": {
    "startup_overview": {
      "name": [{"value": "${companyName}", "sourceType": "web_search", "sourceDetail": ""}],
      "website": [{"value": "${companyWebsite || ""}", "sourceType": "web_search", "sourceDetail": ""}],
      "founding_year": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "location": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "sector_subsector": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "stage": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}]
    },
    "product_market_fit": {
      "brief_overview": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "problem": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "solution": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "unique_selling_point": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "target_customer": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "market_size": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}]
    },
    "financial_snapshot": {
      "revenue_mrr_arr": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "use_of_funds": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}]
    },
    "team": {
      "founders": [],
      "team_gaps": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": ""}]
    },
    "competitive_landscape": {
      "key_competitors_summary": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}]
    },
    "deal_evaluation": {
      "strengths": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": ""}],
      "risks_concerns": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": ""}],
      "vc_fit": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": ""}],
      "next_action": [{"value": "string", "sourceType": "model_knowledge", "sourceDetail": ""}]
    },
    "legal_analysis": {
      "founder_legal_issues": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}],
      "company_legal_issues": [{"value": "string", "sourceType": "web_search", "sourceDetail": ""}]
    }
  }
}
\`\`\`

CRITICAL INSTRUCTIONS FOR JSON:
1. Provide a value for every single key.
2. For SourcedDataPoint arrays, each entry must have value, sourceType, and sourceDetail.
3. Find and analyze at least 5 competitors for both indian_competitors and global_competitors.
4. Generate chart data dynamically based on actual competitor data found.
5. All monetary values in USD as numbers, not strings.
6. Keywords: up to 15 total split between business and technical arrays.`;
}
