-- Where else an app is shown, beyond its category (list of places: src/data/placements.ts).
-- New apps set this in their catalogue file (`placements: [...]`), and `npm run gen:catalog`
-- writes the matching line, so they appear in those places with no other change.
ALTER TABLE public.tools_catalog ADD COLUMN IF NOT EXISTS placements text[] NOT NULL DEFAULT '{}'::text[];

-- Starting places for apps that were live before the column existed.
-- The moving strip on the home page: the apps people use most and the ones that do the most.
UPDATE public.tools_catalog SET placements = array(SELECT DISTINCT unnest(placements || ARRAY['home-strip']))
WHERE id IN ('productvision-360', 'startup-analyser', 'virasat', 'passport-photo-maker', 'remove-background', 'tool-1', 'tool-40', 'ai-photo-enhancer');

-- The creators page: apps a shop, salon or practice buying the ₹999 kit uses most (src/data/kit.ts).
UPDATE public.tools_catalog SET placements = array(SELECT DISTINCT unnest(placements || ARRAY['creators']))
WHERE id IN ('tool-1', 'tool-40', 'remove-background', 'tool-12', 'tool-13', 'tool-15', 'tool-17', 'ai-photo-enhancer');
