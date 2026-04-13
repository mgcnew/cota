import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

const buttonVariants = cva(
  // Base styles from Design System combined with touch target requirements
  cn(ds.components.button.base, "touch-feedback"),
  {
    variants: {
      variant: {
        default: ds.components.button.variants.primary,
        destructive: ds.components.button.variants.danger,
        outline: ds.components.button.variants.secondary,
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-50 shadow-sm", // Fallback para estilo 'muted' consistente com sistema
        ghost: ds.components.button.variants.ghost,
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        // All sizes ensure minimum 44px height on mobile for touch targets via explicit class if not present in DS
        default: cn(ds.components.button.size.default, "min-h-[44px]"),
        sm: cn(ds.components.button.size.sm, "min-h-[44px]"),
        lg: cn(ds.components.button.size.lg, "min-h-[44px]"),
        icon: cn(ds.components.button.size.icon, "min-h-[44px] min-w-[44px]"),
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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

