import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { KIT } from "@/data/kit";

// A rough guide, not a promise. Commission is fixed at 10% and the kit is the one offer on /kit;
// the creator moves how many followers they have and what share of them buy.
const COMMISSION_PCT = 10;
const STANDARD_CONVERSION_PCT = 5;
const FOLLOWERS_MIN = 1_000;
const FOLLOWERS_MAX = 20_000_000;
// The followers slider runs on a log scale, 30 steps per tenfold, so 1,000 and 2 crore are both easy
// to reach and position 30 is exactly 10,000. The last position is exactly 2 crore.
const POS_MAX = 129;
const followersAt = (pos: number) => {
  if (pos >= POS_MAX) return FOLLOWERS_MAX;
  const raw = FOLLOWERS_MIN * Math.pow(10, pos / 30);
  const step = raw >= 10_000_000 ? 500_000 : raw >= 1_000_000 ? 50_000 : raw >= 100_000 ? 5_000 : raw >= 10_000 ? 500 : raw >= 2_000 ? 100 : 50;
  return Math.min(FOLLOWERS_MAX, Math.round(raw / step) * step);
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
/** "2 crore", "5.5 lakh", or nothing below a lakh. */
const inWords = (n: number) => {
  const trim = (x: number) => String(Math.round(x * 10) / 10);
  if (n >= 10_000_000) return `${trim(n / 10_000_000)} crore`;
  if (n >= 100_000) return `${trim(n / 100_000)} lakh`;
  return "";
};

export function EarningsEstimate({ className = "" }: { className?: string }) {
  const [pos, setPos] = useState(30); // 10,000 followers
  const [conversion, setConversion] = useState(STANDARD_CONVERSION_PCT);
  const followers = followersAt(pos);
  const buyers = Math.floor((followers * conversion) / 100);
  const earn = Math.round((buyers * KIT.inr * COMMISSION_PCT) / 100);
  const words = inWords(followers);

  return (
    <div className={`block-card space-y-5 bg-card p-5 md:p-6 ${className}`}>
      <div>
        <h3 className="text-xl font-bold">What could I earn?</h3>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Slide to try it. This counts only the ₹{KIT.inr} kit, at {COMMISSION_PCT}% commission.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <label htmlFor="est-followers" className="text-[15px] font-semibold">Your followers</label>
          <span className="font-display text-lg font-bold sm:text-right">
            {followers.toLocaleString("en-IN")}
            {words && <span className="ml-1.5 text-[13px] font-semibold text-muted-foreground">({words})</span>}
          </span>
        </div>
        <Slider id="est-followers" min={0} max={POS_MAX} step={1} value={[pos]} onValueChange={(v) => setPos(v[0])} aria-label="Your followers" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>1,000</span><span>2 crore</span></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="est-conversion" className="text-[15px] font-semibold">Conversion rate</label>
          <span className="font-display text-lg font-bold">{conversion}%</span>
        </div>
        <Slider id="est-conversion" min={1} max={10} step={0.5} value={[conversion]} onValueChange={(v) => setConversion(v[0])} aria-label="Conversion rate" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>1%</span><span>10%</span></div>
        {conversion !== STANDARD_CONVERSION_PCT && (
          <p className="rounded-lg border-2 border-ink bg-sun/40 px-3 py-2 text-[13px]" role="status">
            {STANDARD_CONVERSION_PCT}% is the industry standard for a creator's link. Slide wherever you like and check the maths yourself.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-ink bg-teal/40 p-3">
          <div className="text-[13px] font-semibold">People who buy</div>
          <div className="mt-1 font-display text-xl font-bold md:text-2xl">{buyers.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-xl border-2 border-ink bg-sun/60 p-3">
          <div className="text-[13px] font-semibold">You could earn about</div>
          <div className="mt-1 font-display text-xl font-bold md:text-2xl">{inr(earn)}</div>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground">
        An estimate only. Real sales depend on your posts, and a refunded sale earns nothing. Your own commission is the one we agree with you.
      </p>
    </div>
  );
}
