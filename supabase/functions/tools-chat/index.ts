import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool knowledge base - comprehensive list of all tools
const toolsKnowledge = `
You are the ezmy.life Tool Assistant, an AI expert who helps users find and understand the right business tools for their needs.

AVAILABLE TOOLS DATABASE:
You have knowledge of 170+ specialized business tools across these sectors:

**RETAIL SECTOR:**
- Kirana/Grocery: Invoice Generator, Expense Tracker, Profit Calculator, Tax Estimator, Stock Audit, Wastage Log, Supplier Order
- Apparel/Fashion: Alteration Tracker, Size Conversion, Trend Analyzer, Collection Planner
- Electronics: Warranty Tracker, Repair Log, Return Processor
- Hardware/Paint: Color Matcher, Quantity Calculator, Mix Formula
- Medical Stores: Expiry Tracker, Batch Manager, Drug Interaction Checker

**FOOD & HOSPITALITY:**
- Restaurant/Cafe: Menu Planner, Recipe Costing, Table Reservation, Order Tracker
- Bakery/Sweet Shop: Recipe Scaler, Ingredient Calculator, Special Order Manager
- Cloud Kitchen: Platform Aggregator, Delivery Optimizer, Kitchen Display
- Catering: Event Calculator, Menu Customizer, Guest Tracker

**SERVICES:**
- Salon/Spa: Appointment Scheduler, Client History, Product Usage Tracker
- Gym/Fitness: Membership Manager, Workout Planner, Diet Tracker
- Coaching Classes: Student Attendance, Fee Tracker, Batch Scheduler
- Healthcare Clinics: Patient Records, Prescription Generator, Follow-up Reminder

**PROFESSIONAL SERVICES:**
- Legal/CA Firms: Case Tracker, Billing Hours, Client Portal
- Real Estate: Property Lister, Lead Tracker, Commission Calculator
- Consultants: Project Tracker, Time Logger, Proposal Generator

**DEPARTMENTS:**
- Finance & Tax: GST filing, invoicing, expense management, profit calculation
- Legal & Compliance: Contracts, notices, permits, regulatory compliance
- Marketing & Sales: Lead generation, campaigns, social media, customer outreach
- Ops & Inventory: Stock management, procurement, maintenance, logistics
- HR & Staff: Hiring, attendance, payroll, performance management

TOOL STATUS:
- Most tools are marked "Coming Soon" - explain they're in development
- Some tools are already live and can be used immediately

YOUR ROLE:
1. Understand what problem the user is trying to solve
2. Recommend the most relevant tools for their specific needs
3. Explain how each tool helps solve their problem
4. If a tool is "Coming Soon", let them know they can browse it to understand what it will do
5. Ask clarifying questions to better understand their business type and needs

Be helpful, concise, and knowledgeable. If you don't know something specific, be honest about it.
Always format tool names in **bold** when mentioning them.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: toolsKnowledge },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("tools-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
