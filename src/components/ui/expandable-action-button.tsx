import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const buttonVariants = {
  view: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-400",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600",
  },
  edit: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-400",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-600",
  },
  delete: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-600 dark:text-red-400",
    hover: "hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-600",
  },
  default: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    hover: "hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600",
  },
};

interface ExpandableActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: keyof typeof buttonVariants;
  disabled?: boolean;
  className?: string;
}

export function ExpandableActionButton({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  className,
}: ExpandableActionButtonProps) {
  const colors = buttonVariants[variant];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 rounded-lg border flex items-center justify-center",
              "transition-all duration-200 shadow-sm hover:shadow-md",
              colors.bg,
              colors.border,
              colors.text,
              colors.hover,
              disabled && "opacity-50 cursor-not-allowed pointer-events-none",
              className
            )}
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
