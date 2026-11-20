export const promoSlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** The app's full store page (src/pages/PromoPage.tsx). */
export const appPagePath = (t: { id: string; name?: string | null }) => `/promo/${t.name ? promoSlug(t.name) : t.id}`;
