import { Button, ButtonProps } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends Omit<ButtonProps, 'variant'> {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  showLabel?: boolean;
}

export function IconButton({ 
  icon: Icon, 
  label, 
  variant = "default",
  showLabel = true,
  className,
  ...props 
}: IconButtonProps) {
  const variantStyles = {
    default: "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20",
    success: "bg-success/10 hover:bg-success/20 text-success border-success/20",
    warning: "bg-warning/10 hover:bg-warning/20 text-warning border-warning/20",
    error: "bg-error/10 hover:bg-error/20 text-error border-error/20",
    info: "bg-info/10 hover:bg-info/20 text-info border-info/20"
  };

  return (
    <Button
      variant="outline"
      className={cn(
        "h-20 md:h-24 flex-col gap-2 border-2 transition-colors duration-150",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 md:h-6 md:w-6" />
      {showLabel && <span className="text-xs md:text-sm font-medium">{label}</span>}
    </Button>
  );
}
