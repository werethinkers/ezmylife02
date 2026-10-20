import { z } from "zod";

/* Listing pieces shared by dev_save_app and dev_save_ai_app. */

export const chargeOptionsSchema = z
  .array(
    z.object({
      label: z.string().min(2).max(60).describe("Short name, e.g. 'Quick split' or 'Export pack'."),
      kind: z.enum(["per_use", "money"]).describe("per_use = a level of use. money = something the developer would sell for rupees (set inr)."),
      inr: z.number().positive().max(100000).optional().describe("Rupee price the developer wants. Only for kind 'money'. The team converts it to credits."),
      note: z.string().max(200).optional().describe("What the person gets, in plain words."),
    }),
  )
  .max(6)
  .describe("Every way the developer wants to charge, so the team can price each one. Replaces the earlier list. Pass [] to clear. The team, not you, decides the credits.");

export const titled = z.object({ title: z.string().trim().min(1).max(60), body: z.string().trim().max(220).optional() });
export const promoSchema = z
  .object({
    headline: z.string().trim().min(10).max(80).describe("The page's main line, for example 'Split any bill in seconds'."),
    tagline: z.string().trim().min(20).max(200).describe("One sentence on what the visitor gets."),
    audience: z.string().trim().max(160).optional().describe("Who it is for."),
    highlights: z.array(titled).min(3).max(6).describe("3 to 6 things the app does well. Real features only."),
    steps: z.array(titled).min(2).max(5).describe("How it works, 2 to 5 steps."),
    faq: z.array(z.object({ q: z.string().trim().min(1).max(120), a: z.string().trim().min(1).max(400) })).max(5).optional(),
  })
  .describe("The app's own promo page. Required. No ratings, reviews, customer quotes or claims the app does not back up.");

export const listingSchema = z
  .object({
    name: z.string().max(60).optional(),
    short_description: z.string().max(160).optional(),
    description: z.string().max(4000).optional(),
    category: z.string().optional(),
    tool_types: z.array(z.string().max(30)).max(5).optional(),
    support_email: z.string().max(200).optional(),
    release_notes: z.string().max(1000).optional(),
    similar_note: z
      .string()
      .max(1000)
      .optional()
      .describe("How this app is different from the similar apps dev_check_similar or dev_run_checks found, in one or two sentences from the developer's own words. Required (20+ characters) when similar apps exist. The admin reads it next to those apps and decides."),
    charge_options: chargeOptionsSchema.optional(),
    promo: promoSchema.optional(),
  })
  .describe("Store listing fields to set. Leave out any field you are not changing.");

