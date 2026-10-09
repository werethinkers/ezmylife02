import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-foreground text-sm font-bold ring-offset-background transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-pink text-ink shadow-block-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-block active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-block-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-block active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        outline:
          "bg-card text-foreground shadow-block-sm hover:-translate-x-px hover:-translate-y-px hover:bg-sun hover:shadow-block active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        secondary: "bg-sand text-secondary-foreground hover:bg-sun",
        ghost: "border-transparent hover:border-foreground/15 hover:bg-foreground/5",
        link: "border-transparent text-primary underline underline-offset-4 decoration-2 hover:decoration-pink",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
