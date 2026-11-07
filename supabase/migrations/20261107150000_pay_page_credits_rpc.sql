-- Pay for a card or website with credits straight from the site (no server function needed): the signed-in
-- person is auth.uid(), and ip_pay_with_credits does the charge, order and publish in one transaction.
CREATE OR REPLACE FUNCTION public.ip_pay_page_credits(_page_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'signin'); END IF;
  RETURN public.ip_pay_with_credits(auth.uid(), _page_id);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.ip_pay_page_credits(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ip_pay_page_credits(uuid) TO authenticated;
