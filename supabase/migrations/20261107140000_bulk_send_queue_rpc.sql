-- "Send all" from the sender's own WhatsApp, charged straight from the site (no server function needed).
-- The signed-in person is auth.uid(); price and charge are ip_bulk_send_start's (1 credit per 10 people).
-- Automatic sending still goes through the ip-bulk-send function, because it has to call WhatsApp.
CREATE OR REPLACE FUNCTION public.ip_bulk_send_queue(_page_id uuid, _lang text, _count int, _consent boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'signin'); END IF;
  IF _consent IS NOT TRUE THEN RETURN jsonb_build_object('ok', false, 'reason', 'consent'); END IF;
  RETURN public.ip_bulk_send_start(auth.uid(), _page_id, 'queue', _lang, _count, NULL);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.ip_bulk_send_queue(uuid, text, int, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ip_bulk_send_queue(uuid, text, int, boolean) TO authenticated;
