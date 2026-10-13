# Admin: give any number of credits to any user

## What exists today
- Admin Dashboard → Credits tab already has "Grant credits": search a user, type an amount, add a note. Only admins can use it (checked on the server).
- Problem: it always adds **free** credits. Free credits are reset to 100 on the 1st of every month, so a big grant (e.g. 5,000) is wiped at month end.
- No way to take credits back, and the amount box starts at 50 with no quick options.

## Changes
1. **Credit type choice** next to the amount:
   - "Lasting (never expire)" — default, goes to the paid balance, survives the monthly reset.
   - "Free (resets monthly)".
2. **Any amount**: no upper cap. Quick buttons 100 / 500 / 1,000 / 5,000 plus a free-type box. Whole numbers only.
3. **Remove credits**: a Give / Take away switch; taking away never drops a balance below 0.
4. **Confirm step** for grants above 10,000 credits ("Give 25,000 lasting credits to x@y.com?").
5. **Show the user's current balance** (free + lasting) after picking them, and refresh it after the grant.
6. Recent grants table shows type (Lasting/Free) and the note; everything is logged in the credit history as before.
7. Same "Grant credits" button on the admin user detail page so you can do it from a user's profile.

Admin-only stays enforced on the server; non-admins get refused.

## Technical details
- `admin-tool-pricing` `grant_credits` already accepts `bucket: "paid" | "free"` and negative deltas (clamped at 0); UI just sends them. Add a server-side integer check and reject 0/NaN. Redeploy.
- Edit `src/components/admin/CreditsAdmin.tsx`; extract a small `GrantCreditsForm` reused in `src/pages/AdminUserDetail.tsx`.
- Ledger reason stays `admin_adjust`; metadata gains `bucket`.
- Test: admin grant of 5,000 lasting raises paid balance by exactly 5,000; non-admin call is refused.

Note: this touches wallet code, per project rules — approving this plan is your go-ahead.
