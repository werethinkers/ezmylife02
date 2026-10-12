import { aiFetch } from "../_shared/ai.ts";
import { serve as stdServe } from "https://deno.land/std@0.168.0/http/server.ts";
import { billed } from "../_shared/billing.ts";

// Every request is signed-in-checked and, for paid actions, charged on the server.
const serve = (handler: (req: Request) => Promise<Response>) =>
  stdServe(billed({ tool: "video-keyframe", defaultCredits: () => 31, isImage: () => true }, (req) => handler(req)));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { prompt, duration, aspectRatio, resolution, startingFrame } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced prompt for video frame generation
    const enhancedPrompt = `Create a professional, cinematic video keyframe/still image. ${prompt}. 
    Make it visually stunning with professional lighting and composition.
    This should look like a high-quality frame from a ${duration || 5} second ${resolution || '1080p'} video.
    Aspect ratio: ${aspectRatio || '16:9'}.`;

    // Build request body for image generation (as video preview/keyframe)
    const requestBody = {
      model: 'google/gemini-2.5-flash-image',
      messages: [
        {
          role: 'user',
          content: startingFrame 
            ? [
                { type: 'text', text: enhancedPrompt },
                { type: 'image_url', image_url: { url: startingFrame } }
              ]
            : enhancedPrompt
        }
      ],
      modalities: ['image', 'text']
    };

    console.log('Generating video frame with prompt:', enhancedPrompt.substring(0, 100));

    const response = await aiFetch(requestBody);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video generation API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate video frame. Please try again.',
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('API response received');

    // Extract image URL from response
    const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (imageUrl) {
      return new Response(
        JSON.stringify({ 
          videoUrl: imageUrl,
          type: 'preview_frame',
          message: 'Generated video preview frame. Full video generation coming soon!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no image URL found, return error
    return new Response(
      JSON.stringify({ 
        error: 'No image was generated. Please try a different prompt.',
        response: result
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in video-generator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
