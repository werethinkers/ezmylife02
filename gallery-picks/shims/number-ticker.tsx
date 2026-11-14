// @ts-nocheck
/* stand-in for the pick's number ticker helper: counts to the new value */
import * as React from "react";
export function NumberTicker({ value, format = (v) => String(v), duration = 0.6, className }) {
  const [shown, setShown] = React.useState(value);
  const from = React.useRef(value);
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const a = from.current, t0 = performance.now(); let raf = 0;
    const tick = (n) => { const t = Math.min(1, (n - t0) / (duration * 1000)); const v = a + (value - a) * (1 - Math.pow(1 - t, 3)); setShown(v); from.current = v; if (t < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>{format(Math.round(shown))}</span>;
}
export default NumberTicker;
