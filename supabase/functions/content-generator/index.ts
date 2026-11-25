import { aiFetch } from "../_shared/ai.ts";
import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  stdServe(billed({
  // Each content type is its own app. Every AI step of the Content Workflow is charged as one
  // "content-workflow-step" run (4 credits), so no step can be used as a free generator.
  tool: (b) => (({
    "social-post": "social-post-generator",
    "captions": "caption-generator",
    "hashtags": "hashtag-generator",
    "content-ideas": "content-idea-generator",
    "video-script": "video-script-writer",
    "workflow-idea": "content-workflow-step",
    "workflow-content": "content-workflow-step",
    "workflow-hashtags": "content-workflow-step",
    "workflow-caption": "content-workflow-step",
  }) as Record<string, string>)[b?.type] ?? "content-generator-unknown",
  defaultCredits: (id) => (id === "content-workflow-step" ? 4 : undefined),
},(req) => handler(req)));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { type, ...raw } = await req.json();
    // Keep every input to a sensible size so one request cannot run up a large AI bill.
    // deno-lint-ignore no-explicit-any
    const params: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw ?? {})) {
      if (typeof v === "string") params[k] = v.slice(0, 4000);
      else if (Array.isArray(v)) params[k] = v.slice(0, 30).map((x) => (typeof x === "string" ? x.slice(0, 200) : x));
      else if (typeof v === "number") params[k] = Math.max(1, Math.min(k === "count" ? 30 : 5000, v));
      else params[k] = v;
    }

    let systemPrompt = "";
    let userMessage = "";

    switch (type) {
      case "social-post":
        systemPrompt = `You are a social media expert. Generate engaging posts optimized for the specified platform. Keep within character limits and include relevant emojis.`;
        userMessage = `Create a ${params.platform} post about: ${params.topic}
Tone: ${params.tone}
Character limit: ${params.charLimit}
Include relevant emojis and make it engaging.`;
        break;

      case "captions":
        systemPrompt = `You are an expert at writing engaging social media captions. Generate ${params.count} unique captions in different styles.`;
        userMessage = `Create ${params.count} captions for: ${params.description}
Style: ${params.style}
Keywords: ${params.keywords?.join(", ") || "none specified"}
Return as a JSON array of strings.`;
        break;

      case "hashtags":
        systemPrompt = `You are a social media hashtag expert. Generate relevant hashtags with varying popularity levels for maximum reach.`;
        userMessage = `Generate ${params.count} hashtags for: ${params.topic}
Mix of high, medium, and low/niche popularity.
Return as JSON: { "hashtags": [{ "tag": "#example", "popularity": "high|medium|low" }] }`;
        break;

      case "content-ideas":
        systemPrompt = `You are a creative content strategist. Generate unique, trending content ideas with hooks and best posting times.`;
        userMessage = `Generate ${params.count} content ideas for: ${params.niche}
${params.format ? `Format: ${params.format}` : "Any format"}
Return as JSON: { "ideas": [{ "title": "", "format": "Reel|Carousel|Story|Video|Blog", "hook": "", "bestTime": "e.g., Tuesday 9 AM" }] }`;
        break;

      case "video-script":
        systemPrompt = `You are a video scriptwriter. Create engaging scripts with clear sections, hooks, and calls to action.`;
        userMessage = `Write a ${params.duration}-second ${params.style} video script about: ${params.topic}
${params.keyPoints?.length ? `Key points: ${params.keyPoints.join(", ")}` : ""}
Return as JSON: { "script": [{ "section": "Hook|Intro|Main|CTA|Outro", "content": "", "duration": "0:00-0:10" }] }`;
        break;

      case "workflow-idea":
        systemPrompt = `You are a content strategist. Generate one viral-worthy content idea.`;
        userMessage = `Generate 1 content idea for ${params.platform} in the ${params.niche} niche.
Return as JSON: { "idea": { "title": "", "hook": "", "format": "Reel|Carousel|Post|Story" } }`;
        break;

      case "workflow-content":
        systemPrompt = `You are a content creator. Write engaging content ready to post.`;
        userMessage = `Create ${params.format} content for ${params.platform} about: ${params.idea}
Make it engaging, valuable, and ready to post.`;
        break;

      case "workflow-hashtags":
        systemPrompt = `Generate relevant hashtags for social media.`;
        userMessage = `Generate ${params.count} hashtags for ${params.platform} about: ${params.topic}
Return as JSON: { "hashtags": ["#tag1", "#tag2", ...] }`;
        break;

      case "workflow-caption":
        systemPrompt = `You are an expert caption writer. Create the perfect caption with hashtags.`;
        userMessage = `Create a caption for ${params.platform}:
Idea: ${params.idea}
Content: ${params.content}
Include these hashtags naturally: ${params.hashtags?.slice(0, 10).join(" ")}
Make it engaging with a strong hook and CTA.`;
        break;

      default:
        throw new Error(`Unknown content type: ${type}`);
    }

    const response = await aiFetch({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse response based on type
    let result: any = {};
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = parsed;
      } else if (type === "captions") {
        // Try to parse as array
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          result = { captions: JSON.parse(arrayMatch[0]) };
        }
      }
    } catch {
      // If JSON parsing fails, return raw content
      result = { content };
    }

    // Ensure correct structure for each type
    if (type === "social-post" && !result.content) {
      result = { content: content.replace(/```[\s\S]*?```/g, "").trim() };
    }
    if (type === "captions" && !result.captions) {
      result = { captions: content.split("\n").filter((l: string) => l.trim()).slice(0, 5) };
    }
    if (type === "hashtags" && !result.hashtags) {
      const tags = content.match(/#\w+/g) || [];
      result = { hashtags: tags.map((tag: string) => ({ tag, popularity: "medium" })) };
    }
    if ((type === "workflow-content" || type === "workflow-caption") && !result.content && !result.caption) {
      result = type === "workflow-caption" 
        ? { caption: content.replace(/```[\s\S]*?```/g, "").trim() }
        : { content: content.replace(/```[\s\S]*?```/g, "").trim() };
    }
    if (type === "workflow-hashtags" && !result.hashtags) {
      const tags = content.match(/#\w+/g) || [];
      result = { hashtags: tags };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Content generator error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
