-- Table to track coupon redemptions
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_code text NOT NULL,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, coupon_code)
);

-- Enable RLS
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Table to track premium access (from coupon or subscription)
CREATE TABLE public.premium_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_type text NOT NULL CHECK (access_type IN ('coupon', 'subscription')),
  stripe_customer_id text,
  stripe_subscription_id text,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.premium_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own premium access
CREATE POLICY "Users can view their own premium access"
ON public.premium_access
FOR SELECT
USING (auth.uid() = user_id);