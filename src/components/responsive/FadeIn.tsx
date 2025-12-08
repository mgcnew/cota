import { memo, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * FadeIn Component
 * 
 * Wrapper component that applies fade-in animation when content loads.
 * Uses CSS-only animation with duration under 200ms for smooth transitions.
 * 
 * Requirements: 10.4
 * - Fade in content with duration under 200ms
 * - Smooth transition when loading completes
 */

export interface FadeInProps {
  /** Content to fade in */
  children: ReactNode;
  /** Whether content is loading (hides content when true) */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animation duration variant */
  duration?: "fast" | "normal" | "slow";
  /** Whether to respect reduced motion preference */
  respectReducedMotion?: boolean;
}

const durationClasses = {
  fast: "duration-100",
  normal: "duration-200",
  slow: "duration-300",
} as const;

export const FadeIn = memo(function FadeIn({
  children,
  isLoading = false,
  className,
  duration = "normal",
  respectReducedMotion = true,
}: FadeInProps) {
  if (isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-fade-in",
        durationClasses[duration],
        respectReducedMotion && "motion-reduce:animate-none motion-reduce:opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
});

/**
 * FadeInContent Component
 * 
 * Alternative component that shows skeleton while loading and fades in content.
 * Useful for data-driven components.
 */
export interface FadeInContentProps extends FadeInProps {
  /** Skeleton/placeholder to show while loading */
  skeleton?: ReactNode;
}

export const FadeInContent = memo(function FadeInContent({
  children,
  isLoading = false,
  skeleton,
  className,
  duration = "normal",
  respectReducedMotion = true,
}: FadeInContentProps) {
  if (isLoading) {
    return skeleton ? <>{skeleton}</> : null;
  }

  return (
    <div
      className={cn(
        "animate-fade-in",
        durationClasses[duration],
        respectReducedMotion && "motion-reduce:animate-none motion-reduce:opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
});

export default FadeIn;
