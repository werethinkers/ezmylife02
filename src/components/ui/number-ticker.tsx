import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Adapted from 21st.dev "Number Ticker" (Magic UI): counts up to `value` once it scrolls into view.
export function NumberTicker({
  value,
  delay = 0,
  decimalPlaces = 0,
  className,
}: {
  value: number;
  delay?: number;
  decimalPlaces?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : 0);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const inView = useInView(ref, { once: true, margin: "0px" });
  const format = (n: number) =>
    Intl.NumberFormat("en-IN", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(Number(n.toFixed(decimalPlaces)));

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [motionValue, inView, delay, value]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spring, decimalPlaces],
  );

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)}>
      {format(reduce ? value : 0)}
    </span>
  );
}
