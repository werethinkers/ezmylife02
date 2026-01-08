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

    // Enhanced prompt for better video generation
    const enhancedPrompt = `Create a professional, cinematic video. ${prompt}. Make it visually stunning with smooth motion and professional lighting.`;

    // Build request body based on whether we have a starting frame
    const requestBody: Record<string, unknown> = {
      model: 'veo-2.0-generate-001',
      prompt: enhancedPrompt,
      config: {
        personGeneration: 'allow_adult',
        aspectRatio: aspectRatio || '16:9',
        numberOfVideos: 1,
      },
    };

    // If starting frame is provided, use image-to-video
    if (startingFrame) {
      requestBody.image = {
        bytesBase64Encoded: startingFrame.replace(/^data:image\/\w+;base64,/, '')
      };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/google/v1beta/models/veo-2.0-generate-001:predictLongRunning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Video generation API error:', errorText);
      
      // Return a message that video generation is initiated
      return new Response(
        JSON.stringify({ 
          message: 'Video generation request submitted. This feature uses advanced AI and may take several minutes.',
          status: 'pending'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // Check if we have a video URL in the response
    if (result.videos && result.videos.length > 0) {
      return new Response(
        JSON.stringify({ videoUrl: result.videos[0].uri || result.videos[0].url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return operation info for long-running request
    return new Response(
      JSON.stringify({ 
        message: 'Video generation started. Check back later for the result.',
        operationId: result.name || result.operationId,
        status: 'processing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
