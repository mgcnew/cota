import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const buttonVariants = {
  view: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-400",
    hover: "hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-800 dark:hover:text-blue-300",
  },
  edit: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-400",
    hover: "hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-800 dark:hover:text-amber-300",
  },
  delete: {
    bg: "bg-red-50 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-600 dark:text-red-400",
    hover: "hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-300",
  },
  default: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    border: "border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    hover: "hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300",
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
  const [isHovered, setIsHovered] = useState(false);
  const colors = buttonVariants[variant];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        width: isHovered ? "auto" : 32,
        paddingLeft: isHovered ? 12 : 0,
        paddingRight: isHovered ? 12 : 0,
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative h-8 rounded-lg border",
        "flex items-center justify-center gap-1.5 overflow-hidden",
        "transition-colors duration-200 shadow-sm hover:shadow-md",
        colors.bg,
        colors.border,
        colors.text,
        colors.hover,
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {icon}
      </span>
      <motion.span
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          width: isHovered ? "auto" : 0,
        }}
        transition={{ duration: 0.15 }}
        className="text-xs font-medium whitespace-nowrap overflow-hidden"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

