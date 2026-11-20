# AI app pricing

Applied 12 Oct 2026 with the owner's approval (migration `20261013100000_ai_prices_3x_and_free_image_limit.sql`). Free credits pay for at most 4 AI images per person; after that image apps need bought credits.

When pricing a new AI app, use the rule below with its model and size, and put the same number in `src/apps/prices/` and `supabase/functions/_shared/appSpecs/`.

**What this shows:** most AI apps priced at 1 to 3 credits earn back 0.4x to 1.8x their AI cost. Image apps earn about 1.2x. The 1-credit Flash-Lite apps already earn 4.3x; they move to 2 credits under the AI minimum.

## The rule

> **Price in credits = round up (AI cost per run in ₹ × 3 ÷ ₹0.376)**, with a minimum of 2 for any app that calls AI. Apps that run fully in the browser stay at 1.

The minimum of 2 was added on 12 Oct 2026 at the owner's choice, so cheap Flash-Lite apps also help pay for hosting and other fixed costs (2 credits earn about ₹0.75 against about ₹0.09 of AI cost). Calculators stay at 1: that price pays for using the calculator, and its optional "Explain" note is a very small Flash-Lite call.

- **₹0.376 is what one credit earns you, at the worst case.** The ₹1,000 pack gives 2,200 credits, which is ₹0.4545 a credit. Taking out 18% GST (assuming pack prices include GST) leaves ₹0.385. Taking out Razorpay's 2% fee plus 18% GST on that fee (2.36% in total) leaves **₹0.376**. On the ₹10 pack a credit earns ₹0.55, so everything below is conservative.
- **× 3** means each paid run brings back three times its AI cost: one share pays for the AI, one covers the free credits you give away (100 for every sign-up), and one goes to hosting, other overheads and profit. This is a policy choice. A multiplier of × 2 gives the lower numbers in the last column of the table.
- **AI cost** is Google's paid list price × a typical number of tokens for each kind of app × ₹96.36 per US dollar.

## Inputs and where they come from

| Input | Value | Source |
|---|---|---|
| Gemini 2.5 Flash | $0.30 per 1M input tokens, $2.50 per 1M output tokens | [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Gemini 2.5 Flash-Lite | $0.10 in, $0.40 out | same page |
| Gemini 2.5 Flash Image | $0.039 per image | same page |
| Gemini 3.1 Flash-Lite Image (Google's named replacement) | $0.0336 per image | same page; [deprecations](https://ai.google.dev/gemini-api/docs/deprecations) |
| Razorpay | 2% + 18% GST on the fee = 2.36% | [Razorpay pricing explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/) |
| USD to INR | ₹96.36 (12 Oct 2026) | [Upstox converter](https://upstox.com/currency-converter/usd-to-inr/) |
| Credit packs | ₹10 = 15 … ₹1,000 = 2,200 | `src/data/creditPacks.ts` |

**Token sizes are estimates. Nothing logs them yet.** These are the assumptions:

- short = about 1,500 tokens in and 1,500 out
- standard = 1,500 in and 2,500 out
- long = 2,000 in and 4,000 out
- vision = about 4,100 in (including 2 photos) and 1,500 out
- an image is one picture plus about 1,500 tokens in

The current price tiers (1, 2 and 3 credits) were set by how complex each app is, so each tier is matched to one of these sizes.

## Result

| Kind of app | Apps | Price now | AI cost / run | Earns back now | New price (× 3) | With × 2 |
|---|---|---|---|---|---|---|
| Flash-Lite documents (1 credit) | 75 | 1 | ₹0.09 | 4.3× | **2 (AI minimum)** | 2 |
| Flash, short (1 credit) | 8 | 1 | ₹0.41 | 0.9× (loss) | **4** | 3 |
| Flash, standard (2 credits) | 42 | 2 | ₹0.65 | 1.2× | **6** | 4 |
| Flash, long: compliance, notice reply (3 credits) | 4 | 3 | ₹1.02 | 1.1× | **9** | 6 |
| Reading photos / documents (vision) | 3 | 1–2 | ₹0.48 | 0.8–1.6× | **4** | 3 |
| One AI image, incl. ProductVision per angle | ~12 | 12 | ₹3.80 | 1.2× | **31** | 21 |
| Same, on Gemini 3.1 Flash-Lite Image | | | ₹3.28 | | **27** | 18 |
| Browser-only apps (resizers, converters, presets) | ~95 | 1 | ₹0 | all margin | no change | |

**In rupees on the ₹250 pack (₹0.50 a credit):** a 6-credit app costs a buyer ₹3, and a 27-credit ProductVision angle costs ₹13.50. A product photographer charges far more per angle, so ProductVision still looks cheap at that price.

## Notes

- The hidden "thinking" fix in PR #2 is already counted here. Without it, Flash apps cost up to about twice the figures above.
- ProductVision on Gemini 3.1 Flash-Lite Image is about 14% cheaper per image than today's model, and Google names it as the replacement. It should be tested on a few real product photos before switching.
- Not repriced yet (model or size not checked): calculators and other apps charged per use, Google Business kit, contract drafter, Startup Analyser, Virasat, and the browser image tools.
- Fixed overheads (hosting, domain, Supabase) are not covered by price alone at today's volume of about 10 runs a month. More paid runs are what covers them.
