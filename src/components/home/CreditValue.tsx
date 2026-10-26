import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, Zap, Flame, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import type { CatalogTool } from "@/hooks/useToolsCatalog";
import { usePricingMap, RUPEES_PER_CREDIT_MAX, RUPEES_PER_CREDIT_MIN, formatRupees } from "@/hooks/usePricingMap";
import { CREDIT_PACKS } from "@/data/creditPacks";
import { cn } from "@/lib/utils";
import { Shelf } from "@/components/store/Shelf";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
} as const;

const TASK_SIZES = [
  { credits: 1, label: "Everyday app", hint: "most apps" },
  { credits: 4, label: "Photo AI", hint: "e.g. background removal" },
  { credits: 17, label: "Deep analysis", hint: "e.g. Startup Analyser" },
];

/** "What does ₹10 actually get you?" — value matrix and a calculator, all from real prices. */
export function CreditValue({ catalog, onBuy }: { catalog: CatalogTool[]; onBuy: (packId: string) => void }) {
  const { user } = useAuth();
  const { costOf, isLoading } = usePricingMap();

  const stats = useMemo(() => {
    const live = catalog.filter((t) => t.is_live);
    const priced = live.map((t) => ({ t, cost: costOf(t.id) }));
    const oneCredit = priced.filter((p) => p.cost === 1).length;
    const priciest = [...priced].sort((a, b) => b.cost - a.cost).slice(0, 2);
    return { total: live.length, oneCredit, priciest };
  }, [catalog, costOf]);

  const pack = (id: string) => CREDIT_PACKS.find((p) => p.id === id)!;
  const cards = [
    {
      id: "free",
      Icon: Gift,
      title: "100 free credits",
      price: "Free",
      lines: ["50 when you sign up", "50 more after your first run", `≈ 100 runs of a 1-credit app`],
    },
    ...[
      { id: "p10", Icon: Zap, note: "A day of quick tasks" },
      { id: "p50", Icon: Flame, note: "Less than a café coffee" },
      { id: "p250", Icon: Crown, note: "Most popular pack" },
    ].map(({ id, Icon, note }) => {
      const p = pack(id);
      return {
        id,
        Icon,
        title: `${p.credits} credits`,
        price: `₹${p.inr}`,
        lines: [note, `≈ ${p.credits} runs of a 1-credit app`, `${formatRupees(p.inr / p.credits)} a run`],
      };
    }),
  ];

  // Calculator
  const [spend, setSpend] = useState(2000);
  const [tasks, setTasks] = useState(60);
  const [size, setSize] = useState(TASK_SIZES[0].credits);
  const credits = tasks * size;
  const low = credits * RUPEES_PER_CREDIT_MIN;
  const high = credits * RUPEES_PER_CREDIT_MAX;
  const diff = spend - high;

  return (
    <div className="space-y-6">
      <Shelf>
        {cards.map((c, i) => (
          <motion.div
            key={c.id}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.05 }}
            className={cn(
              "flex w-[78%] shrink-0 snap-start flex-col rounded-2xl border-2 border-ink p-5 shadow-block sm:w-[46%] lg:w-[23.5%]",
              c.id === "free" ? "bg-ink text-cream" : "bg-card",
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border-2",
                  c.id === "free" ? "border-cream bg-sun text-ink" : "border-ink bg-sun text-ink",
                )}
              >
                <c.Icon className="h-5 w-5" />
              </div>
              <span className={cn("font-display text-2xl font-bold", c.id !== "free" && "text-foreground")}>{c.price}</span>
            </div>
            <p className="mt-4 text-lg font-bold">{c.title}</p>
            <ul className={cn("mt-2 flex-1 space-y-1.5 text-sm", c.id === "free" ? "text-cream/85" : "text-muted-foreground")}>
              {c.lines.map((l) => (
                <li key={l} className="flex gap-2">
                  <Check className={cn("mt-0.5 h-4 w-4 shrink-0", c.id === "free" ? "text-sun" : "text-teal")} />
                  {l}
                </li>
              ))}
            </ul>
            {c.id === "free" ? (
              user ? (
                <p className="mt-5 rounded-xl border-2 border-cream/40 px-3 py-2.5 text-center text-sm font-semibold">Already in your wallet</p>
              ) : (
                <Button asChild className="mt-5 h-11">
                  <Link to="/auth?mode=signup">Claim free credits</Link>
                </Button>
              )
            ) : (
              <Button onClick={() => onBuy(c.id)} variant="outline" className="mt-5 h-11">
                Buy {c.price}
              </Button>
            )}
          </motion.div>
        ))}
      </Shelf>

      {!isLoading && stats.total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {stats.oneCredit} of {stats.total} apps cost 1 credit a run.
          {stats.priciest.length > 0 && (
            <>
              {" "}
              Bigger jobs cost more:{" "}
              {stats.priciest.map((p, i) => (
                <span key={p.t.id}>
                  {i > 0 && " and "}
                  {p.t.name} is {p.cost}
                </span>
              ))}
              .
            </>
          )}
        </p>
      )}

      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border-2 border-ink bg-card px-4 py-2 text-[15px] font-bold shadow-[2px_2px_0_0_hsl(var(--ink))] hover:bg-sun [&::-webkit-details-marker]:hidden">
          Compare with what you pay now <span className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
      <motion.div
        {...fadeUp}
        className="mt-3 grid gap-6 overflow-hidden rounded-2xl border-2 border-ink bg-card p-5 shadow-block md:p-6 lg:grid-cols-5"
      >
        <div className="space-y-7 lg:col-span-3">
          <div>
            <h3 className="text-xl font-bold md:text-2xl">Compare with what you pay now</h3>
            <p className="mt-1 text-sm text-muted-foreground">Your numbers, our real prices.</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="calc-spend" className="text-sm font-semibold">
                You spend on AI subscriptions
              </label>
              <span className="font-display text-lg font-bold tabular-nums">{formatRupees(spend)}/mo</span>
            </div>
            <Slider id="calc-spend" className="mt-3" min={0} max={10000} step={100} value={[spend]} onValueChange={([v]) => setSpend(v)} aria-label="Monthly subscription spend in rupees" />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="calc-tasks" className="text-sm font-semibold">
                AI tasks you run in a month
              </label>
              <span className="font-display text-lg font-bold tabular-nums">{tasks}</span>
            </div>
            <Slider id="calc-tasks" className="mt-3" min={10} max={500} step={10} value={[tasks]} onValueChange={([v]) => setTasks(v)} aria-label="Tasks per month" />
          </div>

          <div>
            <p className="text-sm font-semibold">Typical task</p>
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Typical task size">
              {TASK_SIZES.map((t) => (
                <button
                  key={t.credits}
                  type="button"
                  role="radio"
                  aria-checked={size === t.credits}
                  onClick={() => setSize(t.credits)}
                  className={cn(
                    "rounded-xl border-2 border-ink p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    size === t.credits ? "bg-sun" : "bg-card hover:bg-sand",
                  )}
                >
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.credits} credit{t.credits === 1 ? "" : "s"} · {t.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-2xl border-2 border-ink bg-lime/60 p-6 lg:col-span-2">
          <p className="text-sm text-muted-foreground">On EZYOURLIFE that's {credits.toLocaleString("en-IN")} credits, about</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight">
            {formatRupees(low)}–{formatRupees(high)}
            <span className="text-lg font-semibold text-muted-foreground">/mo</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Lower with bigger packs, higher with ₹10 packs.</p>
          <div className="mt-5 rounded-xl border-2 border-ink bg-card p-4 text-sm">
            {spend === 0 ? (
              <p>Move the first slider to compare with what you pay today.</p>
            ) : diff > 0 ? (
              <p>
                That's at least <strong className="marker">{formatRupees(diff)} a month less</strong> than your subscriptions, if these
                apps cover what you use them for.
              </p>
            ) : (
              <p>At this volume your subscriptions may work out cheaper. Pay-as-you-go wins when you use AI in bursts.</p>
            )}
          </div>
        </div>
      </motion.div>
      </details>
    </div>
  );
}
