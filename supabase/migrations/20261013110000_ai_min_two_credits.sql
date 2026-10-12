-- Every app that calls AI costs at least 2 credits (owner's choice, 12 Oct 2026; docs/pricing.md).
-- Browser-only apps and calculators stay at 1. Only rows still at 1 are raised, so a price an
-- admin has set by hand above 1 is left alone. Apps with no row yet get 2 from the code defaults.
UPDATE public.tool_pricing
SET credit_cost = 2, updated_at = now()
WHERE credit_cost = 1
  AND tool_id IN (
    'tool-14', 'tool-27', 'tool-13', 'tool-11', 'tool-19', 'tool-31', 'tool-41', 'tool-42',
    'tool-43', 'tool-44', 'tool-45', 'tool-46', 'tool-48', 'tool-49', 'tool-50', 'tool-52',
    'tool-53', 'tool-54', 'tool-56', 'tool-57', 'tool-59', 'tool-70', 'tool-71', 'tool-73',
    'tool-76', 'tool-79', 'tool-80', 'tool-81', 'tool-87', 'tool-88', 'tool-89', 'tool-90',
    'tool-91', 'tool-92', 'tool-93', 'tool-94', 'tool-95', 'tool-97', 'tool-98', 'tool-99',
    'tool-100', 'tool-102', 'tool-103', 'tool-21', 'tool-23', 'tool-32', 'tool-34', 'tool-37',
    'tool-35', 'tool-25', 'tool-26', 'tool-20', 'tool-24', 'tool-39', 'tool-22', 'wrong-written-words',
    'smart-diagram-ai', 'soul-mirror', 'html-editor', 'rich-editor', 'book-editor', 'book-editor-html', 'pdf-metadata-ai-analyst', 'dictionary-extractor-ai',
    'tool-28', 'quiz-maker', 'quiz', 'lesson-planner', 'flashcard-maker', 'study-planner', 'exam-scheduler', 'promptmaster-ai',
    'speedy-notebook', 'startup-analyser-chat'
  );
