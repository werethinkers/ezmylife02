import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Gemini fallback keys
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

// Try Lovable AI first, then fallback to direct Gemini API with key rotation
class AIProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callAIWithFallback(
  messages: { role: string; content: string }[],
  model: string,
  stream: boolean,
  userApiKey?: string | null
): Promise<Response> {
  let saw402 = false;
  let saw429 = false;
  let saw400 = false;

  // 1. If user provided their own key, try it first
  if (userApiKey) {
    const geminiModel = model.replace("google/", "");
    const res = await callGeminiDirect(userApiKey, messages, geminiModel, stream);
    if (res.ok) return res;
    if (res.status === 402) saw402 = true;
    if (res.status === 429) saw429 = true;
    if (res.status === 400) saw400 = true;
    console.warn(`User API key failed with ${res.status}, falling back...`);
  }

  // 2. Try Lovable AI gateway
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (LOVABLE_API_KEY) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, stream }),
      });
      if (response.ok) return response;
      if (response.status === 402) saw402 = true;
      if (response.status === 429) saw429 = true;
      if (response.status === 400) saw400 = true;
      console.warn(`Lovable AI returned ${response.status}, trying Gemini fallback keys...`);
    } catch (e) {
      console.warn("Lovable AI gateway error:", e);
    }
  }

  // 3. Fallback to direct Gemini API keys
  const geminiKeys = getGeminiKeys();
  const geminiModel = model.replace("google/", "");

  for (let i = 0; i < geminiKeys.length; i++) {
    try {
      const res = await callGeminiDirect(geminiKeys[i], messages, geminiModel, stream);
      if (res.ok) {
        console.log(`Gemini fallback key ${i + 1} succeeded`);
        return res;
      }
      if (res.status === 402) saw402 = true;
      if (res.status === 429) saw429 = true;
      if (res.status === 400) saw400 = true;
      console.warn(`Gemini key ${i + 1} returned ${res.status}, trying next...`);
    } catch (e) {
      console.warn(`Gemini key ${i + 1} error:`, e);
    }
  }

  if (saw429) {
    throw new AIProviderError(429, "Rate limit exceeded across all available AI keys. Please wait a minute and retry, or add your own Gemini key in Profile.");
  }
  if (saw402) {
    throw new AIProviderError(402, "AI usage credits are exhausted for the available providers. Please add credits or use your own Gemini key in Profile.");
  }
  if (saw400) {
    throw new AIProviderError(400, "AI request was rejected as invalid by all providers.");
  }

  throw new AIProviderError(500, "All AI providers failed unexpectedly. Please try again later.");
}

async function callGeminiDirect(
  apiKey: string,
  messages: { role: string; content: string }[],
  model: string,
  stream: boolean
): Promise<Response> {
  // Convert OpenAI-style messages to Gemini format
  const geminiContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : m.role === "system" ? "user" : m.role,
    parts: [{ text: m.content }],
  }));

  const endpoint = stream ? "streamGenerateContent" : "generateContent";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}?key=${apiKey}${stream ? "&alt=sse" : ""}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: geminiContents,
      generationConfig: { temperature: 0.7 },
    }),
  });

  if (!response.ok) return response;

  if (!stream) {
    // Convert Gemini response to OpenAI format
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return new Response(JSON.stringify({
      choices: [{ message: { content: text } }],
    }), { headers: { "Content-Type": "application/json" } });
  }

  // Convert Gemini SSE stream to OpenAI-compatible SSE stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const geminiChunk = JSON.parse(jsonStr);
            const text = geminiChunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (text) {
              const openaiChunk = {
                choices: [{ delta: { content: text } }],
              };
              await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
            }
          } catch { /* skip malformed */ }
        }
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (e) {
      console.error("Stream transform error:", e);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, companyWebsite, pitchDeckText, action, reportContext, chatMessages, userApiKey } = await req.json();

    // Chat action
    if (action === "chat") {
      const systemPrompt = `You are an expert AI investment analyst assistant. The user has received an analysis report for a startup. Answer follow-up questions based on this context:\n\n${(reportContext || "").substring(0, 4000)}\n\nBe concise and helpful.`;

      const response = await callAIWithFallback(
        [{ role: "system", content: systemPrompt }, ...(chatMessages || [])],
        "google/gemini-2.5-flash",
        true,
        userApiKey
      );

      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Main analysis action
    if (!companyName) throw new Error("Company name is required");

    const analysisPrompt = getAnalysisPrompt(companyName, companyWebsite || "", pitchDeckText || "");

    const response = await callAIWithFallback(
      [
        { role: "system", content: "You are a world-class venture capital analyst. Generate exhaustive, detailed investment analysis reports. Always respond with the exact structure requested." },
        { role: "user", content: analysisPrompt },
      ],
      "google/gemini-2.5-pro",
      true,
      userApiKey
    );

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("startup-analyser error:", e);
    const status = e instanceof AIProviderError ? e.status : 500;
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getAnalysisPrompt(companyName: string, companyWebsite: string, pitchDeckText: string): string {
  const pitchDeckSection = pitchDeckText
    ? `\n\n**PITCH DECK CONTENT (extracted from PDF):**\nUse this as a PRIMARY source of information alongside your web search capabilities. Cross-reference claims made in the pitch deck with publicly available data.\n\n${pitchDeckText.substring(0, 25000)}\n`
    : '';

  return `You are a world-class venture capital analyst. Your task is to generate an Investment Committee (IC) Note for the startup "${companyName}" (${companyWebsite || "website unknown"}).

**PRIMARY SOURCES**: Rely on your knowledge and web search capabilities to conduct a thorough analysis based on publicly available information.${pitchDeckSection}

**CRITICAL DIRECTIVE: BE EXHAUSTIVE.** You must generate content for **every single heading** in the markdown report template below. Similarly, you must provide a value for **every single key** in the JSON data structure. If information is not available, you must explicitly state "Information not publicly available" for that section or key. **DO NOT OMIT ANY SECTIONS OR KEYS.**

Structure your response into two distinct parts: a detailed markdown report and a structured JSON object.

**PART 1: MARKDOWN REPORT (IC NOTE FORMAT)**
Generate a comprehensive markdown report following this exact structure. Do not skip any sections.

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
- **Upstream And Downstream**:
- **Market Challenges**:
- **Innovations Leading The Change**:

## Problem In Detail

## Solution In Detail

## Products

## Pictorial Technology Definition
*CRITICAL: Generate a simple, valid Mermaid.js 'graph TD' diagram that visually explains the company's technology, architecture, or business process.
**IMPORTANT RULES:**
1. **NO SEMICOLONS:** Each statement MUST be on a new line. DO NOT use semicolons (;) to separate statements.
2. **SIMPLE SYNTAX:** Do not use complex features like 'style' or 'classDef' directives.
3. **QUOTES:** All text for node labels and edge labels MUST be enclosed in double quotes.
4. **ENCLOSURE:** The entire diagram definition MUST be enclosed in a \`\`\`mermaid ... \`\`\` code block.

**EXAMPLE:**
\`\`\`mermaid
graph TD
    A["Step 1: User Input"] --> B["Step 2: Processing"]
    B --> C{"Decision Point"}
    C -- "Path A" --> D["Outcome 1"]
    C -- "Path B" --> E["Outcome 2"]
\`\`\`*

## USP/MOAT

## IP (Intellectual Property)

## Competition Landscape
*CRITICAL: You MUST find at least 5-7 Indian competitors and 5-7 Global competitors.*

### Indian Competitors
| Company | Website | HQ | Funding | Valuation | Core Product | Tech Advantage | Our Advantage |
|---|---|---|---|---|---|---|---|

### Global Competitors
| Company | Website | HQ | Funding | Valuation | Core Product | Tech Advantage | Our Advantage |
|---|---|---|---|---|---|---|---|

### Competitors across all verticals

## Traction

## Business Model

## Team
*For each founder, provide their name, title, a brief bio, and a markdown-formatted link to their LinkedIn profile. CRITICAL: Use web search to find any other directorships, ownership, or board positions held by the founders.*

## Fundraises

## Investment Required

## Use Of Investments

## Financial Plan

## Expert Opinion

## Exit Plan
- **Examples Of Secondary Sale**:
- **Examples Of Acquisition**:
- **Examples Of IPO**:

## Investment Risk (Including Regulatory & Compliance Risks)

## Investment Rationale (Including Potential Incentives)

## Conclusion

## Future Roadmap

## Legal & Compliance
### Founder Legal Issues
### Company Legal Issues

**PART 2: JSON DATA**
After the markdown report, include a single JSON object enclosed in \`\`\`json ... \`\`\`.

**CRITICAL INSTRUCTIONS FOR JSON:**
1. **MANDATORY FIELDS**: Provide a value for every single key.
2. **STRUCTURED IC NOTE FIELDS**: Many fields require a \`SourcedDataPoint[]\` array. Each bullet point from the markdown should become a separate \`value\` in a \`SourcedDataPoint\` object.${pitchDeckText ? '\n3. **PITCH DECK SOURCE**: When data comes from the pitch deck, use sourceType "pitch_deck" and sourceDetail should reference the relevant slide/page.' : ''}
3. **PICTORIAL DEFINITION**: The \`pictorial_technology_definition\` field MUST contain the raw Mermaid.js diagram definition string.
4. **KEYWORDS**: Identify up to 15 keywords total, split between 'business' and 'technical'.
5. **COMPETITOR ANALYSIS**: You MUST find and analyze at least 5-7 competitors for both arrays.
6. **DYNAMIC CHARTS**: Chart data must be generated dynamically from actual competitor data.
7. **CHART COLORS**: Generate unique hex colors for each bar.
8. **MONETARY VALUES**: All monetary values in USD as numbers.
9. **ULTRA-DETAILED EXECUTIVE SUMMARY**: For 'executiveSummaryData', be exceptionally detailed. Each bullet point MUST start with "- **Summary:** text".
10. **COMPLETENESS**: Do not include any other text after the JSON block.
11. **JSON VALIDITY**: Ensure perfectly valid JSON.
12. **RESOURCES**: Populate news_articles, youtube_videos, and research_papers arrays (up to 5 each).
13. **MULTI-SOURCE MARKET SIZE CHART**: For 'market_size_chart_data', gather data from 2-3 sources.
14. **SUB-CATEGORY MARKET ANALYSIS**: Generate market_subcategory_share_chart_data (pie) and market_subcategory_growth_chart_data (line).
15. **LEGAL & FOUNDER ANALYSIS**: Populate legal_analysis and founder other_positions.
16. **EXIT OPTIONS**: Provide 2-3 real-world examples for exit_options_ipo and exit_options_acquisition.
17. **FINANCIAL PROJECTIONS**: Provide a 3-5 year financial projection table in financial_projections.

\`\`\`json
{
  "name": "${companyName}",
  "website": "${companyWebsite || ""}",
  "industry": "...",
  "description": "...",
  "founded_year": "...",
  "location": "...",
  "market_analysis": [{"value": "- **History:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "problem_in_detail": [{"value": "- **Core Problem:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "solution_in_detail": [{"value": "- **Core Solution:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "products_analysis": [{"value": "- **Product:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "pictorial_technology_definition": [{"value": "graph TD\\n    A[\\"Start\\"] --> B[\\"End\\"]", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "usp_moat": [{"value": "- **Differentiator:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "ip_summary": [{"value": "- **Patents:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "competition_summary": [{"value": "- **Overview:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "traction_summary": [{"value": "- **Metrics:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "business_model": [{"value": "- **Monetization:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "team_summary": [{"value": "- **Strength:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "fundraises_summary": [{"value": "- **Rounds:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "investment_required": [{"value": "- **The Ask:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "use_of_investments": [{"value": "- **Allocation:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "financial_plan_summary": [{"value": "- **Projections:** ...", "sourceType": "web_search", "sourceDetail": "URL"}],
  "financial_projections": {
    "headers": ["Metric", "2025", "2026", "2027"],
    "rows": [
      {"metric": "Revenue (USD)", "values": [1000000, 5000000, 15000000]},
      {"metric": "Net Profit/Loss (USD)", "values": [300000, 2000000, 7000000]}
    ],
    "source": {"sourceType": "model_knowledge", "sourceDetail": "Estimated projections"}
  },
  "expert_opinion": [{"value": "- **Analysis:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "exit_plan_summary": [{"value": "- **Acquirers:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "investment_risk": [{"value": "- **Risk:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "investment_rationale": [{"value": "- **Rationale:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "conclusion": [{"value": "- **Recommendation:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "future_roadmap": [{"value": "- **Next Steps:** ...", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
  "keywords": {"business": ["keyword1"], "technical": ["keyword1"]},
  "news_articles": [{"title": "...", "url": "...", "summary": "...", "type": "news"}],
  "youtube_videos": [{"title": "...", "url": "...", "summary": "...", "type": "youtube"}],
  "research_papers": [{"title": "...", "url": "...", "summary": "...", "type": "paper"}],
  "indian_competitors": [
    {"name": "...", "website": "...", "hq": "...", "founding_year": "...", "funding": "...", "fundingAmount": 0, "valuation": "...", "key_investors": [], "notable_clients": [], "recent_moves": "...", "core_product": "...", "tech_advantage": "...", "user_co_advantage": "..."}
  ],
  "global_competitors": [
    {"name": "...", "website": "...", "hq": "...", "founding_year": "...", "funding": "...", "fundingAmount": 0, "valuation": "...", "key_investors": [], "notable_clients": [], "recent_moves": "...", "core_product": "...", "tech_advantage": "...", "user_co_advantage": "..."}
  ],
  "indian_competitor_chart_data": {
    "type": "bar",
    "labels": ["${companyName}", "Competitor1"],
    "datasets": [{"label": "Total Funding (USD)", "data": [10000000, 50000000], "backgroundColor": ["#36a2eb", "#ff6384"], "borderColor": ["#36a2eb", "#ff6384"], "borderWidth": 1}]
  },
  "global_competitor_chart_data": {
    "type": "bar",
    "labels": ["${companyName}", "Competitor1"],
    "datasets": [{"label": "Total Funding (USD)", "data": [10000000, 120000000], "backgroundColor": ["#36a2eb", "#4bc0c0"], "borderColor": ["#36a2eb", "#4bc0c0"], "borderWidth": 1}]
  },
  "market_size_chart_data": {
    "type": "line",
    "labels": ["2024", "2025", "2026", "2027", "2028"],
    "datasets": [{"label": "Market Projection", "data": [15000000000, 20000000000, 28000000000, 35000000000, 45000000000], "borderColor": "#ff6384", "fill": true, "tension": 0.4}]
  },
  "market_subcategory_share_chart_data": {
    "type": "pie",
    "labels": ["Sub-Category A", "Sub-Category B", "Others"],
    "datasets": [{"label": "Market Share", "data": [40, 30, 30], "backgroundColor": ["#FF6384", "#36A2EB", "#FFCE56"], "borderWidth": 2}]
  },
  "market_subcategory_growth_chart_data": {
    "type": "line",
    "labels": ["2024", "2025", "2026", "2027", "2028"],
    "datasets": [{"label": "Sub-Category A Growth", "data": [10, 12, 15, 18, 22], "borderColor": "#FF6384", "fill": false, "tension": 0.4}]
  },
  "comparisonMatrix": {
    "headers": ["Feature", "${companyName}", "Competitor A"],
    "rows": [["Core Technology", "...", "..."], ["Pricing Model", "...", "..."]]
  },
  "fundingTrends": "Description of funding trends.",
  "executiveSummaryData": {
    "startup_overview": {
      "name": [{"value": "${companyName}", "sourceType": "model_knowledge", "sourceDetail": "Provided"}],
      "website": [{"value": "${companyWebsite || ""}", "sourceType": "model_knowledge", "sourceDetail": "Provided"}],
      "founding_year": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "location": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "sector_subsector": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "investment_ask": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "investment_committed": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "investment_remaining": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Calculated"}],
      "stage": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "date_of_review": [{"value": "Today's Date", "sourceType": "model_knowledge", "sourceDetail": "N/A"}],
      "author_name": [{"value": "AI Analyst", "sourceType": "model_knowledge", "sourceDetail": "N/A"}]
    },
    "product_market_fit": {
      "brief_overview": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "definition_of_tech": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "problem": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "products_being_sold": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "solution": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "unique_selling_point": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "product_ip_defense": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "target_customer": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "market_size": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "history_of_tech_in_india": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]
    },
    "financial_snapshot": {
      "revenue_mrr_arr": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "use_of_funds": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]
    },
    "team": {
      "founders": [
        {
          "name": [{"value": "Founder Name", "sourceType": "web_search", "sourceDetail": "LinkedIn URL"}],
          "title": [{"value": "CEO", "sourceType": "web_search", "sourceDetail": "URL"}],
          "background": [{"value": "Background details", "sourceType": "web_search", "sourceDetail": "URL"}],
          "linkedin_url": [{"value": "https://linkedin.com/in/profile", "sourceType": "web_search", "sourceDetail": "LinkedIn"}],
          "other_positions": []
        }
      ],
      "team_gaps": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}]
    },
    "competitive_landscape": {
      "key_competitors_summary": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]
    },
    "deal_evaluation": {
      "strengths": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}],
      "risks_concerns": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}],
      "vc_fit": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}],
      "next_action": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}],
      "potential_failure_points": [{"value": "...", "sourceType": "model_knowledge", "sourceDetail": "Analysis"}],
      "exit_options_ipo": [{"company_name": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}], "year": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]}],
      "exit_options_acquisition": [{"company_name": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}], "acquirer": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}], "year": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]}],
      "exit_options_secondary_sale": [{"details": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]}]
    },
    "legal_analysis": {
      "founder_legal_issues": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}],
      "company_legal_issues": [{"value": "...", "sourceType": "web_search", "sourceDetail": "URL"}]
    }
  }
}
\`\`\``;
}
