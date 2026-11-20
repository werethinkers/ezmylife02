# Razorpay Setup Guide

This document covers setting up Razorpay payments for credit purchases and the ₹999 kit.

## Environment Variables (CRITICAL)

The edge functions `create-razorpay-order` and `verify-razorpay-payment` require these environment variables to be set in your Supabase project:

- `RAZORPAY_KEY_ID`: Your Razorpay API Key ID (from Dashboard → Settings → API Keys)
- `RAZORPAY_KEY_SECRET`: Your Razorpay API Secret (from Dashboard → Settings → API Keys)

### How to Set Environment Variables

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Select your project (cmwnjexfpcfpoeyemxhb)
3. Click **Settings** (gear icon) → **Edge Functions** (left sidebar)
4. Click **Secrets** or **Environment Variables**
5. Add:
   - Key: `RAZORPAY_KEY_ID`
   - Value: Your actual Razorpay Key ID
6. Add:
   - Key: `RAZORPAY_KEY_SECRET`
   - Value: Your actual Razorpay Secret
7. **Save** and redeploy the edge functions

### Getting Your Razorpay Credentials

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Copy:
   - Key ID (starts with `rzp_live_` or `rzp_test_`)
   - Secret (a long random string)

**Use test keys for staging, live keys for production.**

## Troubleshooting

### Error: "Edge Function returned a non-2xx status code"

This means the edge function is returning an error. Check:

1. **Are environment variables set?**
   - Go to Supabase Console → Settings → Edge Functions → Secrets
   - Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are present
   - If missing, add them and redeploy

2. **Function logs:**
   - Go to Supabase Console → Functions
   - Click `create-razorpay-order`
   - Open the **Logs** tab to see detailed errors

3. **Razorpay API keys:**
   - Ensure your key and secret are correct (copy-paste carefully)
   - Check that you're using the right environment (test vs. live)
   - If keys are invalid, Razorpay API will return 401

4. **Re-deploy the function:**
   - Make any small change to the .ts file
   - Commit and push to main
   - Push to `main`; Vercel deploys the website

### Payment works but shows "Edge Function returned a non-2xx status code"

This usually means `verify-razorpay-payment` is failing. Check:

1. Function logs (as above)
2. The `settle_payment` shared function in `supabase/functions/_shared/razorpay.ts`
3. Whether the `apply_credit_purchase` RPC is throwing an error

## Payment Flow

1. User clicks "Pay ₹999" on /kit
2. Frontend calls `create-razorpay-order` edge function
3. Edge function:
   - Validates the pack (must be "kit999")
   - Creates a Razorpay order via API
   - Inserts a `credit_purchases` row with status='pending'
   - Returns order details to frontend
4. Razorpay modal opens
5. User completes payment
6. Razorpay calls `handler()` callback with payment response
7. Frontend calls `verify-razorpay-payment` edge function
8. Edge function:
   - Verifies the signature (proves Razorpay is genuine)
   - Settles the payment (queries Razorpay to confirm)
   - Calls `apply_credit_purchase` RPC
   - Updates the purchase to status='paid'
   - Triggers `kit_grant_after_paid` (auto-grants website + card)
9. Frontend redirects to /my-pages?kit=1

## Testing

### Test Kit Purchase

1. Use Razorpay test keys (Key ID and Secret both start with `rzp_test_`)
2. Go to https://ezyourlife.com/kit
3. Click "Pay ₹999"
4. Use test card: **4111 1111 1111 1111** (any future date, any CVV)
5. Verify success → redirected to /my-pages?kit=1

### Check Database

Query the `credit_purchases` table:
```sql
SELECT id, user_id, pack_id, status, credits, razorpay_order_id 
FROM credit_purchases 
WHERE pack_id = 'kit999' 
ORDER BY created_at DESC 
LIMIT 5;
```

Status should be 'paid' after successful payment.

## Refunds

Refunds are handled by the `refund-process` edge function (not yet implemented). For now, process refunds manually:

1. Go to Razorpay Dashboard → Payments
2. Find the payment
3. Click "Refund" and enter the amount
4. Update the `credit_purchases.status` to 'refunded' in Supabase

Full refund system documentation is in `docs/refunds.md` (pending).
