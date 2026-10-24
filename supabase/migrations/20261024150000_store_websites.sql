-- Website templates for schools, places to stay and neighbourhood shops (src/instant/catalog/stores.ts).
-- The page builder hides a product until it has a row here, so apply this with the release.
INSERT INTO public.ip_products (id, family, category, name, price_inr, is_featured, sort) VALUES
  ('kirana', 'business', 'business', 'Kirana & Grocery Store', 199, true, 105),
  ('pharmacy', 'business', 'business', 'Pharmacy / Medical Store', 249, true, 106),
  ('school', 'business', 'business', 'School Website', 349, true, 107),
  ('hotel', 'business', 'business', 'Hotel Website', 349, true, 108),
  ('mobile-shop', 'business', 'business', 'Mobile & Electronics Shop', 249, true, 109),
  ('hardware-store', 'business', 'business', 'Hardware & Building Materials', 249, false, 110),
  ('general-store', 'business', 'business', 'Shop / General Store', 199, false, 111),
  ('preschool', 'business', 'business', 'Play School / Preschool', 299, false, 112),
  ('hostel-pg', 'business', 'business', 'Hostel & PG', 249, false, 113),
  ('resort', 'business', 'business', 'Resort & Homestay', 349, false, 114),
  ('stationery-shop', 'business', 'business', 'Books, Stationery & Toys', 199, false, 115),
  ('optical-shop', 'business', 'business', 'Optical Store', 249, false, 116),
  ('pet-shop', 'business', 'business', 'Pet Shop & Grooming', 249, false, 117),
  ('agri-store', 'business', 'business', 'Agri Store / Krishi Kendra', 199, false, 118),
  ('wholesaler', 'business', 'business', 'Wholesaler & Manufacturer', 299, false, 119)
ON CONFLICT (id) DO NOTHING;
