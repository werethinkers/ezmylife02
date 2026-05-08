## Changes to `src/pages/Credits.tsx`

**1. Update hero subtitle (line 150)**
Replace:
> "Pay only for what you use, starting at ₹10. Free credits reset every month — paid credits never expire."

With:
> "Pay only for successful runs, starting at ₹10. Free credits reset every month — paid credits never expire."

**2. Update per-pack pricing line**

Currently each pack shows:
> "For ₹1 you get **{cpr}** credits · save {savePct}%"

Change it to anchor the baseline at **₹1 = 1 credit** (struck through) then show the discounted real rate:

```
₹1 = 1 credit  →  ₹1 = {cpr.toFixed(2)} credits · save {savePctVsOne}%
```

- Strikethrough: `₹1 = 1 credit` (using `<span className="line-through text-muted-foreground/60">`)
- Highlighted: `₹1 = {cpr} credits` in foreground/primary
- `savePctVsOne = Math.round((cpr - 1) * 100)` (percentage extra credits vs the 1:1 baseline) — shown only when > 0, in emerald

This keeps the existing discount logic visually but reframes the anchor as ₹1 = 1 credit so the value is immediately obvious.

### Out of scope
- No changes to `CREDIT_PACKS` data, payment flow, wallet, or trust badges.
- No changes to other pages.
