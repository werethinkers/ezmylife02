-- Google Business Kit: self-serve Google Business Profile app for any business.
-- Lives at /google-business (owner, signed in) and /rv (public customer review page).
INSERT INTO public.tools_catalog (id, name, description, category, source, is_live, is_premium, is_free, dedicated_route, display_order, tool_types)
VALUES (
  'google-business-kit',
  'Google Business Kit',
  'Add your business and products — get local keywords, Google profile content, review links & QR, and a reviews dashboard.',
  'Marketing & Sales',
  'business',
  true,
  false,
  false,
  '/google-business',
  6,
  ARRAY['Marketing & Sales', 'AI & Automation', 'Customer Service']
)
ON CONFLICT (id) DO NOTHING;

-- 2 credits each time a new business kit is created (and per business in Bulk mode).
INSERT INTO public.tool_pricing (tool_id, cost_inr, credit_cost)
VALUES ('google-business-kit', 0.6, 2)
ON CONFLICT (tool_id) DO NOTHING;
