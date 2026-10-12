# Fix kit page payments (no design changes)

## What I found
- The Razorpay keys (Key ID, Key Secret, webhook secret) are already saved and shared by every payment function. The influencer kit page uses the same checkout as credit packs, so no separate "influencer" keys are needed.
- No kit (Rs. 999) order has ever been recorded, while normal credit-pack orders are. This points to the live checkout function being an older version that does not know the kit pack yet (exact cause to be confirmed in step 1).

## Steps
1. Call the live checkout with the kit pack and read the error and function logs to confirm the cause.
2. Redeploy the payment functions (create order, verify payment, webhook) so the live versions include the kit pack and the current Razorpay keys.
3. If the keys themselves are rejected by Razorpay, open the secure form for you to re-enter the live Key ID and Secret.
4. Verify: the kit "Pay Rs. 999" button opens the Razorpay window with the right amount, and a kit order row is created as pending.

## Not changed
- No page design, wording, prices, or influencer screens.
- Credit-granting logic stays as is.

## Technical details
- Functions: `create-razorpay-order` (has `kit999` in PACKS), `verify-razorpay-payment`, `razorpay-webhook`.
- Secrets used: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- Kit grant runs via the existing `kit_grant_after_paid` trigger on paid `kit999` purchases.
