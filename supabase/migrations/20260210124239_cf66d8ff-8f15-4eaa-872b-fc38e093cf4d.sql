-- Fix: allow 'trial' in premium_access access_type check constraint
ALTER TABLE public.premium_access DROP CONSTRAINT premium_access_access_type_check;
ALTER TABLE public.premium_access ADD CONSTRAINT premium_access_access_type_check CHECK (access_type = ANY (ARRAY['coupon'::text, 'subscription'::text, 'trial'::text]));