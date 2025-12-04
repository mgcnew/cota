/**
 * Mobile Animation Utilities
 * 
 * Provides conditional animation configuration for mobile devices.
 * Disables hover effects and reduces transition durations on mobile.
 * 
 * Requirements: 6.1
 * - Disable complex animations like hover effects and long transitions on mobile
 * - Reduce transition duration to 150ms on mobile (vs 200ms+ on desktop)
 */

export const ANIMATION_CONFIG = {
  mobile: {
    duration: 150, // ms - shorter for mobile
    enableHover: false,
    enableComplexTransitions: false,
  },
  desktop: {
    duration: 200, // ms - standard for desktop
    enableHover: true,
    enableComplexTransitions: true,
  },
} as const;

/**
 * Get animation configuration based on device type
 */
export function getAnimationConfig(isMobile: boolean) {
  return isMobile ? ANIMATION_CONFIG.mobile : ANIMATION_CONFIG.desktop;
}

/**
 * Get transition duration class based on device type
 * Returns Tailwind duration class
 */
export function getTransitionDuration(isMobile: boolean): string {
  return isMobile ? 'duration-150' : 'duration-200';
}

/**
 * Get conditional hover classes
 * Returns empty string on mobile (no hover), hover classes on desktop
 */
export function getHoverClasses(hoverClasses: string, isMobile: boolean): string {
  return isMobile ? '' : hoverClasses;
}

/**
 * Build animation class string with mobile optimizations
 * Combines base classes with conditional hover and transition classes
 */
export function buildAnimationClasses(options: {
  base?: string;
  hover?: string;
  transition?: string;
  isMobile: boolean;
}): string {
  const { base = '', hover = '', transition = 'transition-all', isMobile } = options;
  
  const classes: string[] = [];
  
  if (base) classes.push(base);
  if (transition) classes.push(transition);
  
  // Add duration based on device
  classes.push(getTransitionDuration(isMobile));
  
  // Only add hover classes on desktop
  if (!isMobile && hover) {
    classes.push(hover);
  }
  
  return classes.filter(Boolean).join(' ');
}

/**
 * CSS class names for mobile-optimized animations
 * Use these directly in className props
 */
export const mobileAnimationClasses = {
  // Transition with mobile-optimized duration
  transitionMobile: 'transition-mobile',
  
  // Hover effect only on desktop (uses @media (hover: hover))
  hoverDesktop: 'hover-desktop',
  
  // No hover effect class - use on mobile
  noHover: 'no-hover-mobile',
  
  // Reduced motion for accessibility
  reducedMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
} as const;
