-- Developer apps, part 5: the running-cost estimate counts only outside costs.
-- Our own hosting (database, bandwidth) is not counted. What can really cost money per run is a call to a
-- paid outside service: an AI provider (blocked by the checks, shown here if found) or any other paid API
-- (maps, SMS, email, payments, data feeds). Free font and script CDNs are ignored.
-- Admin-only, same as before: dev_cost_estimate is not callable by users and only admin_dev_queue returns it.
CREATE OR REPLACE FUNCTION public.dev_cost_estimate(_bytes integer, _hosts text[])
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  _ai_re  constant text := '(openai|anthropic|generativelanguage\.googleapis|aiplatform\.googleapis|groq|mistral|cohere|openrouter|together\.(xyz|ai)|huggingface|deepseek|perplexity|api\.x\.ai|replicate)';
  _paid_re constant text := '(maps\.googleapis|googleapis\.com/(vision|translate|speech|texttospeech)|vision\.googleapis|translate\.googleapis|speech\.googleapis|texttospeech\.googleapis|mapbox|(^|\.)here\.com|twilio|msg91|textlocal|gupshup|sendgrid|mailgun|mailchimp|postmark|resend\.com|sendinblue|brevo|elevenlabs|assemblyai|deepgram|stability\.ai|serpapi|serper\.dev|scrapingbee|apify|firecrawl|newsapi|alphavantage|twelvedata|openweathermap|weatherapi|rapidapi|razorpay|stripe|paypal|cashfree|paytm|clearbit|hunter\.io|apollo\.io|zerobounce|virustotal|ipinfo|ipstack|exchangerate|fixer\.io|opencagedata|positionstack)';
  _free_re constant text := '(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|code\.jquery\.com|cdn\.tailwindcss\.com|esm\.sh)$';
  _overhead constant numeric := 0.01;
  _margin   constant numeric := 3;
  _worst    constant numeric := 0.108;
  _ai text[]; _paid text[]; _out text[]; _notes text[] := '{}';
BEGIN
  SELECT COALESCE(array_agg(h ORDER BY h) FILTER (WHERE h ~* _ai_re), '{}'),
         COALESCE(array_agg(h ORDER BY h) FILTER (WHERE h !~* _ai_re AND h ~* _paid_re), '{}'),
         COALESCE(array_agg(h ORDER BY h) FILTER (WHERE h !~* _ai_re AND h !~* _paid_re AND h !~* _free_re), '{}')
    INTO _ai, _paid, _out
  FROM unnest(COALESCE(_hosts, '{}')) AS h;
  IF cardinality(_ai) > 0 THEN
    _notes := _notes || ('AI calls found (' || array_to_string(_ai, ', ') || '). Each run would cost real money per call. Do not approve until they are removed.')::text;
  END IF;
  IF cardinality(_paid) > 0 THEN
    _notes := _notes || ('Known paid services called (' || array_to_string(_paid, ', ') || '). They bill per call or need a key the app cannot hold. Get the per-call price, add it to the credits, or ask the developer to remove them.')::text;
  END IF;
  IF cardinality(_out) > 0 THEN
    _notes := _notes || ('Other outside services called: ' || array_to_string(_out, ', ') || '. Any that bill per call is a hidden cost: find the per-call price and add it to the credits you set.')::text;
  END IF;
  _notes := _notes || 'Our own hosting (database, bandwidth) is not counted.'::text;
  RETURN jsonb_build_object(
    'bytes', COALESCE(_bytes, 0),
    'egress_inr', 0,
    'overhead_inr', _overhead,
    'per_run_inr', _overhead,
    'margin', _margin,
    'worst_case_inr_per_credit', _worst,
    'min_credits', greatest(1, ceil(_overhead * _margin / _worst - 0.000001)::integer),
    'ai_hosts', to_jsonb(_ai),
    'paid_hosts', to_jsonb(_paid),
    'outside_hosts', to_jsonb(_out),
    'notes', to_jsonb(_notes));
END $$;
REVOKE ALL ON FUNCTION public.dev_cost_estimate(integer, text[]) FROM PUBLIC, anon, authenticated;
