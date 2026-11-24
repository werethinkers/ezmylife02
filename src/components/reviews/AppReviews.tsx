import { useCallback, useEffect, useState } from "react";
import { Star, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────── */

interface Review {
  id: string;
  user_id: string;
  display_name: string | null;
  rating: number;
  body: string | null;
  created_at: string;
}

/* ─── Star picker ────────────────────────────────────────────────── */

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-all duration-150",
              n <= active
                ? "fill-sun stroke-ink scale-110"
                : "fill-transparent stroke-ink/40 group-hover:stroke-ink/70",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Rating summary bar ─────────────────────────────────────────── */

function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm">
      <div className="flex flex-col items-center">
        <span className="font-display text-5xl font-extrabold leading-none">{avg.toFixed(1)}</span>
        <div className="mt-1.5 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn("h-4 w-4", n <= Math.round(avg) ? "fill-sun stroke-ink" : "fill-transparent stroke-ink/30")}
            />
          ))}
        </div>
        <span className="mt-1 text-xs text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </span>
      </div>
      <div className="flex-1 min-w-[140px] space-y-1">
        {dist.map(({ n, count }) => (
          <div key={n} className="grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs">
            <span className="font-bold">{n}</span>
            <span className="h-2.5 overflow-hidden rounded-full border border-ink/20 bg-sand">
              <span
                className="block h-full rounded-full bg-sun transition-all duration-500"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
              />
            </span>
            <span className="text-right text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Review form ────────────────────────────────────────────────── */

function ReviewForm({
  toolId,
  existing,
  onSaved,
}: {
  toolId: string;
  existing: Review | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "You";

  const submit = async () => {
    if (!user || rating === 0) return;
    setSaving(true);
    await supabase.from("app_reviews").upsert(
      {
        tool_id: toolId,
        user_id: user.id,
        display_name: displayName,
        rating,
        body: body.trim() || null,
      },
      { onConflict: "tool_id,user_id" },
    );
    setSaving(false);
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border-2 border-ink bg-card px-4 py-2.5 font-display text-sm font-bold shadow-block-sm transition hover:bg-sun focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="h-4 w-4" />
        {existing ? "Edit your review" : "Write a review"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-card p-5 shadow-block-sm space-y-4">
      <div>
        <p className="mb-2 font-display text-sm font-bold">Your rating</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <p className="mb-2 font-display text-sm font-bold">
          Your review <span className="font-normal text-muted-foreground">(optional)</span>
        </p>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 1000))}
          placeholder="What did you use it for? Did it save you time?"
          className="min-h-[90px] resize-none border-2 border-ink focus-visible:ring-ring"
        />
        <p className="mt-1 text-right text-[11px] text-muted-foreground">{body.length}/1000</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={submit}
          disabled={rating === 0 || saving}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {existing ? "Update review" : "Post review"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} className="border-2 border-ink">
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Review card ────────────────────────────────────────────────── */

function ReviewCard({ review }: { review: Review }) {
  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  const name = review.display_name || "Anonymous";
  const date = new Date(review.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border-2 border-ink/15 bg-card p-4 shadow-[2px_2px_0_0_hsl(var(--ink)/0.08)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display text-xs font-bold">
          {initials(name) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-display text-sm font-bold">{name}</span>
            <span className="text-[11px] text-muted-foreground">{date}</span>
          </div>
          <div className="mt-0.5 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn("h-3.5 w-3.5", n <= review.rating ? "fill-sun stroke-ink" : "fill-transparent stroke-ink/25")}
              />
            ))}
          </div>
        </div>
      </div>
      {review.body && (
        <p className="mt-3 text-sm leading-relaxed text-ink/85">{review.body}</p>
      )}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */

/**
 * Full reviews section for an app's PromoPage.
 * Shows rating summary, a "Write a review" form (signed-in users),
 * and a list of all reviews.
 */
export function AppReviews({ toolId }: { toolId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_reviews")
      .select("id, user_id, display_name, rating, body, created_at")
      .eq("tool_id", toolId)
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }, [toolId]);

  useEffect(() => { load(); }, [load]);

  const myReview = reviews.find((r) => r.user_id === user?.id) ?? null;

  return (
    <section>
      <h2 className="mb-4 font-display text-xl font-bold sm:text-2xl">Ratings &amp; Reviews</h2>

      {reviews.length > 0 && (
        <div className="mb-4">
          <RatingSummary reviews={reviews} />
        </div>
      )}

      {user ? (
        <div className="mb-6">
          <ReviewForm toolId={toolId} existing={myReview} onSaved={load} />
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <a href="/auth" className="font-semibold underline-offset-2 hover:underline">
            Sign in
          </a>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-ink/20 p-6 text-center text-sm text-muted-foreground">
          No reviews yet — be the first to review this app!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );
}
