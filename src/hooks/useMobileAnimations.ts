/**
 * useMobileAnimations Hook
 * 
 * Provides animation configuration and class utilities optimized for mobile devices.
 * Automatically detects device type and returns appropriate animation settings.
 * 
 * Requirements: 6.1
 * - Disable hover effects on mobile
 * - Reduce transition durations to 150ms on mobile
 */

import { useMemo } from 'react';
import { useIsMobile } from './use-mobile';
import { 
  ANIMATION_CONFIG, 
  getAnimationConfig, 
  buildAnimationClasses,
  mobileAnimationClasses 
} from '@/utils/mobileAnimations';

export interface MobileAnimationOptions {
  /** Base classes always applied */
  base?: string;
  /** Hover classes (only applied on desktop) */
  hover?: string;
  /** Transition classes */
  transition?: string;
}

export interface UseMobileAnimationsReturn {
  /** Whether the device is mobile */
  isMobile: boolean;
  /** Animation configuration for current device */
  config: typeof ANIMATION_CONFIG.mobile | typeof ANIMATION_CONFIG.desktop;
  /** Transition duration in ms */
  duration: number;
  /** Whether hover effects are enabled */
  hoverEnabled: boolean;
  /** Build animation classes with mobile optimizations */
  buildClasses: (options: Omit<MobileAnimationOptions, 'isMobile'>) => string;
  /** Pre-built class names for common patterns */
  classes: typeof mobileAnimationClasses;
  /** Get hover classes (returns empty on mobile) */
  getHoverClasses: (hoverClasses: string) => string;
}

/**
 * Hook for mobile-optimized animations
 * 
 * @example
 * ```tsx
 * const { buildClasses, hoverEnabled, duration } = useMobileAnimations();
 * 
 * return (
 *   <div className={buildClasses({
 *     base: 'rounded-lg p-4',
 *     hover: 'hover:bg-gray-100 hover:scale-102',
 *     transition: 'transition-all'
 *   })}>
 *     Content
 *   </div>
 * );
 * ```
 */
export function useMobileAnimations(): UseMobileAnimationsReturn {
  const isMobile = useIsMobile();
  
  const config = useMemo(() => getAnimationConfig(isMobile), [isMobile]);
  
  const buildClasses = useMemo(() => {
    return (options: Omit<MobileAnimationOptions, 'isMobile'>) => 
      buildAnimationClasses({ ...options, isMobile });
  }, [isMobile]);
  
  const getHoverClasses = useMemo(() => {
    return (hoverClasses: string) => isMobile ? '' : hoverClasses;
  }, [isMobile]);
  
  return {
    isMobile,
    config,
    duration: config.duration,
    hoverEnabled: config.enableHover,
    buildClasses,
    classes: mobileAnimationClasses,
    getHoverClasses,
  };
}

export { ANIMATION_CONFIG, mobileAnimationClasses };
