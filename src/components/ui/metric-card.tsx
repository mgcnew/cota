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
      cardBg: "bg-purple-50 dark:bg-purple-950/30",
      iconBg: "bg-purple-600 dark:bg-purple-500",
      iconColor: "text-white",
      border: "border-purple-200 dark:border-purple-800",
      glow: "shadow-md hover:shadow-lg shadow-purple-100 dark:shadow-purple-900/50",
      titleColor: "text-purple-700 dark:text-purple-300"
    },
    success: {
      cardBg: "bg-green-50 dark:bg-green-950/30",
      iconBg: "bg-green-600 dark:bg-green-500",
      iconColor: "text-white",
      border: "border-green-200 dark:border-green-800",
      glow: "shadow-md hover:shadow-lg shadow-green-100 dark:shadow-green-900/50",
      titleColor: "text-green-700 dark:text-green-300"
    },
    warning: {
      cardBg: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-600 dark:bg-amber-500",
      iconColor: "text-white",
      border: "border-amber-200 dark:border-amber-800",
      glow: "shadow-md hover:shadow-lg shadow-amber-100 dark:shadow-amber-900/50",
      titleColor: "text-amber-700 dark:text-amber-300"
    },
    error: {
      cardBg: "bg-red-50 dark:bg-red-950/30",
      iconBg: "bg-red-600 dark:bg-red-500",
      iconColor: "text-white",
      border: "border-red-200 dark:border-red-800",
      glow: "shadow-md hover:shadow-lg shadow-red-100 dark:shadow-red-900/50",
      titleColor: "text-red-700 dark:text-red-300"
    },
    info: {
      cardBg: "bg-blue-50 dark:bg-blue-950/30",
      iconBg: "bg-blue-600 dark:bg-blue-500",
      iconColor: "text-white",
      border: "border-blue-200 dark:border-blue-800",
      glow: "shadow-md hover:shadow-lg shadow-blue-100 dark:shadow-blue-900/50",
      titleColor: "text-blue-700 dark:text-blue-300"
    }
  };

  const styles = variantStyles[variant];

  const trendColor = trend?.type === "positive"
    ? "text-green-600 dark:text-green-400"
    : trend?.type === "negative"
      ? "text-red-600 dark:text-red-400"
      : "text-gray-600 dark:text-gray-400";

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] group",
        styles.border,
        styles.glow,
        styles.cardBg,
        className
      )}
    >
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-semibold", styles.titleColor)}>
          {title}
        </CardTitle>
        <div className={cn(
          "p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200",
          styles.iconBg
        )}>
          <Icon className={cn("h-4 w-4 md:h-5 md:w-5", styles.iconColor)} />
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn("text-xs font-semibold", trendColor)}>
              {trend.value}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
