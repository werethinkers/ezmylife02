import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, context, selections, format, keywords } = await req.json();

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let prompt = '';

    if (action === 'brainstorm') {
      const isText = format === 'text';
      const goal = isText
        ? "Rewrite or expand this message for different professional or social contexts."
        : "Generate creative variations of an image/video prompt.";

      prompt = `Task: ${goal}
Source Input: "${context}"
Keywords/Style: ${(selections || []).join(', ')}
Target Format: ${format?.toUpperCase() || 'TEXT'}

Generate exactly 5 distinct variations.
If format is TEXT, focus on tone, clarity, and impact.
If format is IMAGE/VIDEO, focus on visual description, lighting, and composition.

Provide a short catchy title for each.

RESPOND WITH ONLY a JSON array of objects with "title" and "prompt" keys. No other text.`;
    } else if (action === 'magic_write') {
      const isText = format === 'text';
      const instruction = isText
        ? "Perform 'Magic Write' on this draft. Expand it into 3 distinct, highly polished versions (e.g., Persuasive, Concise, Creative)."
        : "Perform 'Magic Write' on these keywords. Expand them into 3 distinct, highly descriptive, and artistic visual prompt variations.";

      prompt = `Input: "${keywords}"
Format: ${format?.toUpperCase() || 'TEXT'}
Instruction: ${instruction}

Provide a title for each.

RESPOND WITH ONLY a JSON array of objects with "title" and "prompt" keys. No other text.`;
    } else if (action === 'analyze_image') {
      prompt = "STRICT OUTPUT RULE: Return ONLY keywords. NO introductory phrases. Format: [Visual Keywords] | [Audio Keywords]. No sentences. Raw data only.";
    } else {
      throw new Error('Unknown action: ' + action);
    }

    const requestBody: Record<string, unknown> = {
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    };

    // For image analysis, we can't send images through this API easily, 
    // so we'll handle it differently
    if (action === 'analyze_image') {
      delete requestBody.response_format;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('promptmaster-ai error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
