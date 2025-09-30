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
      gradient: "from-primary/5 to-primary-light/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      border: "border-primary/20"
    },
    success: {
      gradient: "from-success/5 to-success/10",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      border: "border-success/20"
    },
    warning: {
      gradient: "from-warning/5 to-warning/10",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      border: "border-warning/20"
    },
    error: {
      gradient: "from-error/5 to-error/10",
      iconBg: "bg-error/10",
      iconColor: "text-error",
      border: "border-error/20"
    },
    info: {
      gradient: "from-info/5 to-info/10",
      iconBg: "bg-info/10",
      iconColor: "text-info",
      border: "border-info/20"
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
        "relative overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        styles.border,
        className
      )}
    >
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", styles.iconBg)}>
          <Icon className={cn("h-4 w-4 md:h-5 md:w-5", styles.iconColor)} />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-xl md:text-2xl font-bold text-foreground">{value}</div>
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
