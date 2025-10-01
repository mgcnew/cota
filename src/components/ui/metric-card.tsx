import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant = "default",
  className 
}: MetricCardProps) {
  const variantStyles = {
    default: {
      gradient: "from-primary/10 via-primary-light/5 to-transparent",
      iconBg: "bg-primary dark:bg-gradient-to-br dark:from-primary dark:to-primary-light",
      iconColor: "text-white",
      border: "border-primary/30",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:shadow-[0_0_25px_rgba(59,130,246,0.25)]"
    },
    success: {
      gradient: "from-success/10 via-success-light/5 to-transparent",
      iconBg: "bg-success dark:bg-gradient-to-br dark:from-success dark:to-success-light",
      iconColor: "text-white",
      border: "border-success/30",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)] dark:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
    },
    warning: {
      gradient: "from-warning/10 via-warning-light/5 to-transparent",
      iconBg: "bg-warning dark:bg-gradient-to-br dark:from-warning dark:to-warning-light",
      iconColor: "text-white",
      border: "border-warning/30",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)] dark:shadow-[0_0_25px_rgba(245,158,11,0.25)]"
    },
    error: {
      gradient: "from-error/10 via-error-light/5 to-transparent",
      iconBg: "bg-error dark:bg-gradient-to-br dark:from-error dark:to-error-light",
      iconColor: "text-white",
      border: "border-error/30",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)] dark:shadow-[0_0_25px_rgba(239,68,68,0.25)]"
    },
    info: {
      gradient: "from-info/10 via-info-light/5 to-transparent",
      iconBg: "bg-info dark:bg-gradient-to-br dark:from-info dark:to-info-light",
      iconColor: "text-white",
      border: "border-info/30",
      glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)] dark:shadow-[0_0_25px_rgba(139,92,246,0.25)]"
    }
  };

  const styles = variantStyles[variant];

  const trendColor = trend?.type === "positive" 
    ? "text-success" 
    : trend?.type === "negative" 
    ? "text-error" 
    : "text-muted-foreground";

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-500 hover:scale-[1.03] group",
        styles.border,
        styles.glow,
        "bg-gradient-to-br",
        styles.gradient,
        className
      )}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2.5 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", 
          styles.iconBg
        )}>
          <Icon className={cn("h-4 w-4 md:h-5 md:w-5", styles.iconColor)} />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-xl md:text-2xl font-bold text-foreground group-hover:scale-105 transition-transform duration-300">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className={cn("text-xs font-medium", trendColor)}>
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
