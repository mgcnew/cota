import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles with touch target support (Requirements: 2.5, 18.1)
  // Mobile: min-h-[44px] ensures 44px touch target
  // Active state provides touch feedback (Requirements: 18.5)
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-feedback",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/25 active:bg-destructive/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        // All sizes ensure minimum 44px height on mobile for touch targets
        default: "h-10 min-h-[44px] px-4 py-2",
        sm: "h-9 min-h-[44px] rounded-md px-3",
        lg: "h-11 min-h-[44px] rounded-md px-8",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
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
