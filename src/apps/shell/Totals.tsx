/**
 * Live money panel shown under an item table in a form (`preview` on a doc app).
 *
 * The amount is visible before the person spends a credit, and the same figures are sent to
 * the model through the app's `compute`, so the finished document carries real arithmetic
 * rather than the model's guess at it.
 */
import { inr } from "./Fields";

export function Totals({ sub, tax, total, note }: { sub: number; tax?: number; total: number; note?: string }) {
  if (!total) return null;
  return (
    <div className="rounded-xl bg-primary/5 p-3 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {sub !== total && (
          <span>
            Subtotal: <strong>{inr(sub)}</strong>
          </span>
        )}
        {tax ? (
          <span>
            Tax: <strong>{inr(tax)}</strong>
          </span>
        ) : null}
        <span>
          Total: <strong>{inr(total)}</strong>
        </span>
      </div>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
