-- Phase 2: a category can now open a file converter ("file"), next to quick, photo, document and sheet.
-- Changes only the allowed values of catalog_categories.kind; no rows are touched.
ALTER TABLE public.catalog_categories DROP CONSTRAINT IF EXISTS catalog_categories_kind_check;
ALTER TABLE public.catalog_categories ADD CONSTRAINT catalog_categories_kind_check CHECK (kind IN ('quick', 'photo', 'document', 'sheet', 'file'));
