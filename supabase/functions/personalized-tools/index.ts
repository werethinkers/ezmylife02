import { aiFetch } from "../_shared/ai.ts";
import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  stdServe(billed({ tool: () => null }, (req) => handler(req)));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Knowledge base of available tools
const toolsKnowledge = `
Available Tools by Department:

FINANCE & ACCOUNTING:
- Invoice Generator: Create tax-compliant bills with GST calculations
- Expense Tracker: Log daily expenses to track spending
- Profit Calculator: Calculate margins after all costs
- Tax Estimator: Estimate GST/TDS liability
- Bad Debt Recovery: Draft messages for unpaid dues

LEGAL & COMPLIANCE:
- Contract Drafter: Create service agreements
- Compliance Checklist: List licenses/permits needed
- Notice Reply Bot: Reply to government notices
- Dispute Letter: Write complaint letters
- Safety Protocol: Generate workplace safety checklists

MARKETING & SALES:
- Cold Outreach: Pitch services to new clients
- Offer Generator: Create discount strategies
- Review Replier: Reply to customer reviews
- Customer Follow-up: Schedule lead reminders
- Social Media Plan: Create content calendars
- Campaign Manager: Launch marketing campaigns
- Loyalty Program: Manage customer rewards
- Lead Magnet: Capture potential leads
- Discount Strategist: Calculate optimal discounts

OPERATIONS & INVENTORY:
- Stock Audit: Count physical inventory
- Wastage Log: Track damaged/expired items
- Supplier Order: Draft purchase orders
- Maintenance Log: Track equipment repairs
- Shift Handover: Notes for shift managers
- Stock Watchdog: Inventory reorder alerts
- Vendor Rater: Score suppliers
- Quality Check: Product quality inspection

HR & STAFFING:
- Hiring Job Post: Write job descriptions
- Interview Guide: Candidate questions
- Salary Calculator: Calculate payouts
- Warning Letter: Draft formal warnings
- Daily Task List: Assign staff duties
- Shift Planner: Schedule staff shifts
- Payroll Engine: Calculate salaries
- Attendance Tracker: Track attendance
- Performance Scorecard: Rate employee performance

CUSTOMER SERVICE:
- Ticket Manager: Track customer complaints
- FAQ Builder: Create common answers
- Feedback Collector: Gather customer feedback

EDUCATION TOOLS:
- Quiz Maker: Create interactive quizzes
- Lesson Planner: Plan lessons and curriculum
- Grade Calculator: Calculate student grades
- Study Planner: Create study schedules
- Flashcard Maker: Create study flashcards
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { userProfile, conversationType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("API key not configured");
    }

    let systemPrompt = "";
    let userMessage = "";

    if (conversationType === "interview") {
      systemPrompt = `You are a friendly business consultant helping users discover the right tools for their work. 
      
Your goal is to ask 2-3 short, conversational questions to understand:
1. What industry/field they work in
2. Their role (owner, manager, employee, student, teacher)
3. Their biggest daily challenges or tasks

Keep questions brief and friendly. Don't mention any specific tools yet.
After gathering info, respond with "READY_TO_SUGGEST" so we know you have enough information.`;
      userMessage = userProfile.lastMessage || "Hi, I'm looking for tools to help with my work.";
    } else if (conversationType === "suggest") {
      systemPrompt = `You are a business tools expert. Based on the user's profile, suggest 5-8 relevant tools from our catalog.

${toolsKnowledge}

For each tool, explain WHY it would help them specifically based on their situation.
Also create a simple workflow showing how they could use 3-4 tools together to solve their main challenge.

Format your response as:
## Recommended Tools for You

[List tools with personalized explanations]

## Your Productivity Workflow

[Step by step workflow using the tools]

Be specific and reference their industry/role in your explanations.`;
      userMessage = `User Profile:
- Industry: ${userProfile.industry || "Not specified"}
- Role: ${userProfile.role || "Not specified"}  
- Main Challenges: ${userProfile.challenges || "Not specified"}
- Conversation History: ${userProfile.conversationHistory || "None"}

Please suggest the most relevant tools and create a workflow for them.`;
    } else {
      systemPrompt = `You are a helpful business consultant. Continue the conversation naturally to understand the user's needs.
      
${toolsKnowledge}

If you have enough information about their work, provide personalized tool suggestions.
Otherwise, ask a follow-up question to better understand their needs.`;
      userMessage = userProfile.lastMessage || "";
    }

    const response = await aiFetch({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(userProfile.messages || []),
          { role: "user", content: userMessage }
        ],
        stream: true,
      });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Service is busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Unable to process request" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("personalized-tools error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
