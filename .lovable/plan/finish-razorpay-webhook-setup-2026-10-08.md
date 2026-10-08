# Finish Razorpay webhook setup

Current state: your Razorpay key ID and key secret are saved. The webhook secret (RAZORPAY_WEBHOOK_SECRET) is not saved yet.

## Steps
1. Deploy the payment functions (razorpay-webhook, verify-razorpay-payment, create-razorpay-order) and confirm razorpay-webhook shows in Cloud → Edge Functions.
2. Send a test request with no signature to confirm the webhook is live. It should reply "not configured" until the secret is saved.
3. You, in the Razorpay Dashboard → Settings → Webhooks: add the webhook URL, tick payment.captured, payment.authorized and order.paid, and set a strong secret (for example from a password manager).
4. A secure form opens here. Paste the same secret as RAZORPAY_WEBHOOK_SECRET.
5. Repeat the unsigned test request. It should now be rejected with "Invalid signature" (401), which proves the secret is loaded.
6. You make one real ₹10 purchase. Then I check:
   - Your wallet went up by exactly 15 credits, once.
   - The purchase is marked paid, with one ledger entry.
   - The webhook logs show a 200 reply with noop: true (the in-browser check credited first).

No app code changes.
