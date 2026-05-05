
ALTER FUNCTION public.tool_pricing_set_credits() SET search_path = public;
ALTER FUNCTION public.handle_new_user_credits() SET search_path = public;
ALTER FUNCTION public.compute_credit_cost(numeric) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.ensure_wallet(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_signup_bonus(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.grant_first_action_bonus(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.monthly_free_reset() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.start_tool_run(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_tool_run(uuid, uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_credit_purchase(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, int, text, text) FROM PUBLIC, anon;
