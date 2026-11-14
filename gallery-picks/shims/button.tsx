// @ts-nocheck
/* stand-in for a pick's own button helper: shadcn-like variants, plus primary/secondary and a render prop */
import * as React from "react";
import { cn } from "@/lib/utils";
const V = { default: "bg-primary text-primary-foreground hover:bg-primary/90", primary: "bg-primary text-primary-foreground hover:bg-primary/90", secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80", outline: "border border-input bg-background hover:bg-accent", ghost: "hover:bg-accent" };
const S = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", default: "h-10 px-4 text-sm", lg: "h-11 px-6 text-sm", icon: "h-10 w-10" };
export const Button = React.forwardRef(({ className, variant = "default", size = "default", render, nativeButton, asChild, children, ...p }, ref) => {
  const cls = cn("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:opacity-50 [&_svg]:size-4", V[variant] || V.default, S[size] || S.default, className);
  if (render && React.isValidElement(render)) return React.cloneElement(render, { ref, className: cls, ...p }, children);
  return <button ref={ref} className={cls} {...p}>{children}</button>;
});
export const buttonVariants = () => "";
export default Button;
