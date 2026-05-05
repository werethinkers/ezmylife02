
DROP TRIGGER IF EXISTS tool_pricing_set_credits_trg ON public.tool_pricing;

CREATE OR REPLACE FUNCTION public.tool_pricing_set_credits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only auto-recompute credit_cost from cost_inr when cost_inr actually changed
  -- AND credit_cost was not explicitly set in the same change.
  IF TG_OP = 'INSERT' THEN
    IF NEW.credit_cost IS NULL OR NEW.credit_cost = 1 THEN
      NEW.credit_cost := public.compute_credit_cost(NEW.cost_inr);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.cost_inr IS DISTINCT FROM OLD.cost_inr
       AND NEW.credit_cost IS NOT DISTINCT FROM OLD.credit_cost THEN
      NEW.credit_cost := public.compute_credit_cost(NEW.cost_inr);
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER tool_pricing_set_credits_trg
BEFORE INSERT OR UPDATE ON public.tool_pricing
FOR EACH ROW EXECUTE FUNCTION public.tool_pricing_set_credits();
