/* Stand-in for the common "Marquee" helper some picks import but don't ship. */
import * as React from "react";
import { cn } from "@/lib/utils";
type P = React.HTMLAttributes<HTMLDivElement> & { reverse?: boolean; pauseOnHover?: boolean; vertical?: boolean; repeat?: number };
const CSS = `@keyframes gx-mq{to{transform:translateX(calc(-100% - var(--gap)))}}@keyframes gx-mqv{to{transform:translateY(calc(-100% - var(--gap)))}}
.gx-mq{--gap:1rem;--duration:40s;display:flex;gap:var(--gap);overflow:hidden;padding:.5rem}.gx-mq.v{flex-direction:column}
.gx-mq>div{display:flex;flex-shrink:0;justify-content:space-around;gap:var(--gap);animation:gx-mq var(--duration) linear infinite}
.gx-mq.v>div{flex-direction:column;animation-name:gx-mqv}.gx-mq.r>div{animation-direction:reverse}.gx-mq.p:hover>div{animation-play-state:paused}`;
export function Marquee({ className, reverse, pauseOnHover, vertical, repeat = 4, children, ...p }: P) {
  return (
    <div {...p} className={cn("gx-mq", vertical && "v", reverse && "r", pauseOnHover && "p", className)}>
      <style>{CSS}</style>
      {Array.from({ length: repeat }, (_, i) => <div key={i} aria-hidden={i > 0 || undefined}>{children}</div>)}
    </div>
  );
}
export default Marquee;
