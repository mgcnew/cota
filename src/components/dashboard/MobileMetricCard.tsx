import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

interface MobileMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  pulse?: boolean;
  isEmpty?: boolean;
  trend?: {
    value: string | number;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
}

const VARIANT_STYLES = {
  default: {
    bg: "bg-brand",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    text: "text-white",
    textMuted: "text-white/70",
    pulse: "bg-white/40",
    shadow: "shadow-brand/30",
  },
  success: {
    bg: "bg-emerald-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    text: "text-white",
    textMuted: "text-white/70",
    pulse: "bg-white/40",
    shadow: "shadow-emerald-400/30",
  },
  warning: {
    bg: "bg-amber-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    text: "text-white",
    textMuted: "text-white/70",
    pulse: "bg-white/40",
    shadow: "shadow-amber-400/30",
  },
  error: {
    bg: "bg-red-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    text: "text-white",
    textMuted: "text-white/70",
    pulse: "bg-white/40",
    shadow: "shadow-red-400/30",
  },
  info: {
    bg: "bg-blue-500",
    iconBg: "bg-white/20",
    iconColor: "text-white",
    text: "text-white",
    textMuted: "text-white/70",
    pulse: "bg-white/40",
    shadow: "shadow-blue-400/30",
  },
};

const DARK_OVERRIDE = "dark:bg-zinc-900/90 dark:shadow-none dark:border dark:border-zinc-800";
const DARK_ICON = "dark:bg-accent dark:text-foreground";
const DARK_TEXT = "dark:text-zinc-50";
const DARK_TEXT_MUTED = "dark:text-zinc-400";

export const MobileMetricCard = memo(function MobileMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  onClick,
  pulse = false,
  isEmpty = false,
  trend,
}: MobileMetricCardProps) {
  const v = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        // Base dimensions – fixed width so ribbon shows multiple cards
        "relative overflow-hidden rounded-2xl",
        "w-[168px] flex-shrink-0",
        "p-4 flex flex-col justify-between",
        // Min height for touch targets
        "min-h-[148px]",
        // Color
        v.bg,
        DARK_OVERRIDE,
        // Shadow
        "shadow-lg",
        v.shadow,
        // Touch interactions
        "transition-all duration-200",
        onClick && "cursor-pointer active:scale-95 active:brightness-95",
        // Dimmed if empty / inactive
        isEmpty && "opacity-50 grayscale cursor-default"
      )}
      onClick={isEmpty ? undefined : onClick}
      role={onClick && !isEmpty ? "button" : undefined}
      aria-label={`${title}: ${value}`}
    >
      {/* Large background silhouette – always visible at low opacity for richness */}
      <div className="absolute -right-5 -bottom-5 pointer-events-none opacity-10 dark:opacity-[0.04]">
        <Icon size={120} strokeWidth={1} />
      </div>

      {/* Top row: Icon + optional pulse indicator */}
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-2.5 rounded-xl",
            v.iconBg,
            v.iconColor,
            DARK_ICON
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Pulse dot – shows urgency without harsh colors */}
        {pulse && !isEmpty && (
          <span className="relative flex h-2.5 w-2.5 mt-1">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                v.pulse,
                "dark:bg-brand"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                v.pulse,
                "dark:bg-brand"
              )}
            />
          </span>
        )}
      </div>

      {/* Value + label */}
      <div className="relative z-10">
        <p
          className={cn(
            "text-[9px] font-black uppercase tracking-[0.12em] mb-1",
            "opacity-80",
            v.text,
            DARK_TEXT_MUTED
          )}
        >
          {title}
        </p>
        <h3
          className={cn(
            "text-3xl font-black tracking-tight leading-none mb-1",
            v.text,
            DARK_TEXT
          )}
        >
          {value}
        </h3>
        {trend ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center",
              "bg-white/20 text-white"
            )}>
              {trend.value}
            </span>
            <span className={cn("text-[10px] leading-tight", v.textMuted, DARK_TEXT_MUTED)}>
              {trend.label}
            </span>
          </div>
        ) : subtitle ? (
          <p
            className={cn(
              "text-[11px] font-medium leading-tight",
              v.textMuted,
              DARK_TEXT_MUTED
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Bottom accent line – Dark mode brand indicator on hover */}
      <div className="hidden dark:block absolute bottom-0 left-0 h-[2px] w-full bg-brand scale-x-0 active:scale-x-100 transition-transform origin-left duration-300" />
    </div>
  );
});
