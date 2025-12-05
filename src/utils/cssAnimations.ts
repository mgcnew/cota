/**
 * CSS-Only Animation Utilities
 * 
 * Provides optimized animation classes that use only CSS transform and opacity
 * for GPU-accelerated, 60fps animations.
 * 
 * Requirements: 11.1, 11.4, 11.5
 * - Use CSS transforms and opacity only for animations
 * - Hardware-accelerated animations
 * - Duration limits: 150ms hover, 200ms transition, 300ms modal
 */

/**
 * Animation duration constants (in milliseconds)
 * These match the CSS custom properties defined in index.css
 */
export const ANIMATION_DURATIONS = {
  /** Hover state transitions - fastest for immediate feedback */
  hover: 150,
  /** Standard transitions between states */
  transition: 200,
  /** Modal/overlay animations - slightly longer for smooth appearance */
  modal: 300,
  /** Maximum allowed duration for any animation */
  max: 300,
} as const;

/**
 * CSS animation class names for transform/opacity only animations
 * These classes ensure GPU acceleration and 60fps performance
 */
export const cssAnimationClasses = {
  // ============================================
  // BASE TRANSITION CLASSES
  // ============================================
  
  /** Base transition for transform property only */
  transitionTransform: 'transition-transform',
  
  /** Base transition for opacity property only */
  transitionOpacity: 'transition-opacity',
  
  /** Combined transform + opacity transition (most common) */
  transitionTransformOpacity: 'transition-transform-opacity',
  
  // ============================================
  // DURATION CLASSES
  // ============================================
  
  /** 150ms duration - for hover states */
  durationHover: 'duration-150',
  
  /** 200ms duration - for standard transitions */
  durationTransition: 'duration-200',
  
  /** 300ms duration - for modals and overlays */
  durationModal: 'duration-300',
  
  // ============================================
  // EASING CLASSES
  // ============================================
  
  /** Standard easing for most animations */
  easeOut: 'ease-out',
  
  /** Smooth easing for natural feel */
  easeInOut: 'ease-in-out',
  
  /** Spring-like easing for playful animations */
  easeSpring: 'ease-spring',
  
  // ============================================
  // HOVER EFFECT CLASSES (transform/opacity only)
  // ============================================
  
  /** Scale up slightly on hover */
  hoverScale: 'hover-scale',
  
  /** Lift up on hover with shadow */
  hoverLift: 'hover-lift',
  
  /** Fade opacity on hover */
  hoverFade: 'hover-fade',
  
  /** Combined scale + opacity hover */
  hoverScaleFade: 'hover-scale-fade',
  
  // ============================================
  // ACTIVE/PRESS EFFECT CLASSES
  // ============================================
  
  /** Scale down on press for tactile feedback */
  activePress: 'active-press',
  
  /** Subtle scale down for buttons */
  activeScale: 'active-scale',
  
  // ============================================
  // ENTER/EXIT ANIMATION CLASSES
  // ============================================
  
  /** Fade in animation */
  animateFadeIn: 'animate-fade-in',
  
  /** Fade out animation */
  animateFadeOut: 'animate-fade-out',
  
  /** Scale in from smaller */
  animateScaleIn: 'animate-scale-in',
  
  /** Scale out to smaller */
  animateScaleOut: 'animate-scale-out',
  
  /** Slide in from bottom (for modals) */
  animateSlideInBottom: 'animate-slide-in-bottom',
  
  /** Slide out to bottom */
  animateSlideOutBottom: 'animate-slide-out-bottom',
  
  /** Slide in from right (for drawers) */
  animateSlideInRight: 'animate-slide-in-right',
  
  /** Slide out to right */
  animateSlideOutRight: 'animate-slide-out-right',
  
  // ============================================
  // GPU ACCELERATION HELPERS
  // ============================================
  
  /** Force GPU layer creation for smoother animations */
  gpuAccelerated: 'gpu-accelerated',
  
  /** Will-change hint for transform */
  willChangeTransform: 'will-change-transform',
  
  /** Will-change hint for opacity */
  willChangeOpacity: 'will-change-opacity',
} as const;

/**
 * Build animation class string for common use cases
 */
export function buildAnimationClass(options: {
  type: 'hover' | 'transition' | 'modal';
  effect?: 'scale' | 'lift' | 'fade' | 'scale-fade';
  includeActive?: boolean;
}): string {
  const { type, effect = 'scale', includeActive = true } = options;
  
  const classes: string[] = [
    cssAnimationClasses.transitionTransformOpacity,
  ];
  
  // Add duration based on type
  switch (type) {
    case 'hover':
      classes.push(cssAnimationClasses.durationHover);
      break;
    case 'transition':
      classes.push(cssAnimationClasses.durationTransition);
      break;
    case 'modal':
      classes.push(cssAnimationClasses.durationModal);
      break;
  }
  
  // Add easing
  classes.push(cssAnimationClasses.easeOut);
  
  // Add hover effect
  switch (effect) {
    case 'scale':
      classes.push(cssAnimationClasses.hoverScale);
      break;
    case 'lift':
      classes.push(cssAnimationClasses.hoverLift);
      break;
    case 'fade':
      classes.push(cssAnimationClasses.hoverFade);
      break;
    case 'scale-fade':
      classes.push(cssAnimationClasses.hoverScaleFade);
      break;
  }
  
  // Add active state for touch feedback
  if (includeActive) {
    classes.push(cssAnimationClasses.activePress);
  }
  
  return classes.join(' ');
}

/**
 * Get modal animation classes based on direction
 */
export function getModalAnimationClasses(direction: 'bottom' | 'right' | 'center' = 'bottom'): {
  enter: string;
  exit: string;
  backdrop: string;
} {
  const baseClasses = `${cssAnimationClasses.durationModal} ${cssAnimationClasses.easeOut}`;
  
  switch (direction) {
    case 'bottom':
      return {
        enter: `${baseClasses} ${cssAnimationClasses.animateSlideInBottom}`,
        exit: `${baseClasses} ${cssAnimationClasses.animateSlideOutBottom}`,
        backdrop: `${baseClasses} ${cssAnimationClasses.animateFadeIn}`,
      };
    case 'right':
      return {
        enter: `${baseClasses} ${cssAnimationClasses.animateSlideInRight}`,
        exit: `${baseClasses} ${cssAnimationClasses.animateSlideOutRight}`,
        backdrop: `${baseClasses} ${cssAnimationClasses.animateFadeIn}`,
      };
    case 'center':
    default:
      return {
        enter: `${baseClasses} ${cssAnimationClasses.animateScaleIn} ${cssAnimationClasses.animateFadeIn}`,
        exit: `${baseClasses} ${cssAnimationClasses.animateScaleOut} ${cssAnimationClasses.animateFadeOut}`,
        backdrop: `${baseClasses} ${cssAnimationClasses.animateFadeIn}`,
      };
  }
}

/**
 * Validate that an animation duration is within limits
 */
export function isValidAnimationDuration(duration: number, type: 'hover' | 'transition' | 'modal'): boolean {
  const maxDuration = ANIMATION_DURATIONS[type];
  return duration > 0 && duration <= maxDuration;
}

/**
 * Get the maximum allowed duration for an animation type
 */
export function getMaxDuration(type: 'hover' | 'transition' | 'modal'): number {
  return ANIMATION_DURATIONS[type];
}

// ============================================
// REDUCED MOTION SUPPORT
// Requirement: 11.2 - Respect prefers-reduced-motion
// ============================================

/**
 * CSS classes for reduced motion support
 * These classes disable or reduce animations when user prefers reduced motion
 */
export const reducedMotionClasses = {
  /** Disable all animations when reduced motion is preferred */
  motionReduce: 'motion-reduce',
  
  /** Disable transitions when reduced motion is preferred */
  motionReduceTransition: 'motion-reduce:transition-none',
  
  /** Disable transforms when reduced motion is preferred */
  motionReduceTransform: 'motion-reduce:transform-none',
  
  /** Disable all motion (transitions + transforms + animations) */
  motionReduceAll: 'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:animate-none',
  
  /** Safe animation - respects reduced motion preference */
  motionSafe: 'motion-safe',
  
  /** Only animate when motion is safe */
  motionSafeAnimate: 'motion-safe:animate-fade-in',
  
  /** Only transition when motion is safe */
  motionSafeTransition: 'motion-safe:transition-all',
} as const;

/**
 * Build animation classes with reduced motion support
 * Automatically adds motion-reduce classes to disable animations
 * when user has prefers-reduced-motion enabled
 */
export function buildAccessibleAnimationClass(options: {
  type: 'hover' | 'transition' | 'modal';
  effect?: 'scale' | 'lift' | 'fade' | 'scale-fade';
  includeActive?: boolean;
  respectReducedMotion?: boolean;
}): string {
  const { respectReducedMotion = true, ...rest } = options;
  
  const baseClasses = buildAnimationClass(rest);
  
  if (respectReducedMotion) {
    return `${baseClasses} ${reducedMotionClasses.motionReduceAll}`;
  }
  
  return baseClasses;
}

/**
 * Check if user prefers reduced motion
 * Can be used for JavaScript-based animation decisions
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook-like function to get animation config based on reduced motion preference
 * Returns disabled config if user prefers reduced motion
 */
export function getAccessibleAnimationConfig(isMobile: boolean): {
  duration: number;
  enableHover: boolean;
  enableTransitions: boolean;
  enableAnimations: boolean;
} {
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return {
      duration: 0,
      enableHover: false,
      enableTransitions: false,
      enableAnimations: false,
    };
  }
  
  return {
    duration: isMobile ? ANIMATION_DURATIONS.hover : ANIMATION_DURATIONS.transition,
    enableHover: !isMobile,
    enableTransitions: true,
    enableAnimations: true,
  };
}
