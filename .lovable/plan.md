## Update each credit pack card in `src/pages/Credits.tsx`

Reframe the pricing display so the **₹1 = 1 credit baseline** is the anchor (struck through), and the actual discounted credits stand out.

### New layout per pack card

```
₹10                                        [Popular]
─────────────────────────────────
~~₹10 = 10 credits~~        ← large, strikethrough, muted
⚡ 15 credits               ← XL, bold, primary color
You save 50%                ← emerald, small
─────────────────────────────────
[ Buy ]
```

### Specifics
- Replace the current "For ₹1 you get X credits · save Y%" line.
- Big strikethrough line: `₹{pack.inr} = {pack.inr} credits` — `text-lg`, `line-through`, `text-muted-foreground`.
- Headline credits: `⚡ {pack.credits} credits` — `text-2xl font-bold text-primary`.
- Savings: `Save {Math.round(((pack.credits - pack.inr) / pack.inr) * 100)}%` in emerald, only when `pack.credits > pack.inr`.
- Keep the top-right "Popular" / "Best value" badges and Buy button as-is.
- Remove now-unused `BASELINE_CREDITS_PER_RUPEE` import if no longer referenced.

### Out of scope
- No data changes to `CREDIT_PACKS`.
- No changes to payment flow, wallet, hero subtitle, or trust badges.
