/**
 * Property-Based Tests for Mobile Animations
 * 
 * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
 * **Validates: Requirements 6.1**
 * 
 * Tests that for any component with animation configuration rendered in mobile context,
 * hover effects and transitions longer than 150ms are disabled.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ANIMATION_CONFIG,
  getAnimationConfig,
  getTransitionDuration,
  getHoverClasses,
  buildAnimationClasses,
} from '../mobileAnimations';

/**
 * Constants for animation requirements
 * Based on Requirements 6.1
 */
const MOBILE_MAX_DURATION = 150; // ms
const DESKTOP_DURATION = 200; // ms

/**
 * Arbitrary generator for hover class strings
 */
const hoverClassArb = fc.constantFrom(
  'hover:bg-gray-100',
  'hover:scale-105',
  'hover:shadow-lg',
  'hover:opacity-80',
  'hover:bg-primary hover:text-white',
  'hover:border-primary hover:ring-2'
);

/**
 * Arbitrary generator for base class strings
 */
const baseClassArb = fc.constantFrom(
  'rounded-lg p-4',
  'flex items-center gap-2',
  'bg-white shadow-sm',
  'border border-gray-200',
  'text-sm font-medium'
);

/**
 * Arbitrary generator for transition class strings
 */
const transitionClassArb = fc.constantFrom(
  'transition-all',
  'transition-colors',
  'transition-transform',
  'transition-opacity',
  'transition-shadow'
);

describe('Mobile Animations - Property Tests', () => {
  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: Mobile animation config has duration <= 150ms
   */
  it('mobile animation duration is at most 150ms', () => {
    const mobileConfig = ANIMATION_CONFIG.mobile;
    
    expect(mobileConfig.duration).toBeLessThanOrEqual(MOBILE_MAX_DURATION);
    expect(mobileConfig.duration).toBe(150);
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: Mobile animation config disables hover effects
   */
  it('mobile animation config disables hover effects', () => {
    const mobileConfig = ANIMATION_CONFIG.mobile;
    
    expect(mobileConfig.enableHover).toBe(false);
    expect(mobileConfig.enableComplexTransitions).toBe(false);
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: Desktop animation config enables hover effects
   */
  it('desktop animation config enables hover effects', () => {
    const desktopConfig = ANIMATION_CONFIG.desktop;
    
    expect(desktopConfig.enableHover).toBe(true);
    expect(desktopConfig.enableComplexTransitions).toBe(true);
    expect(desktopConfig.duration).toBe(DESKTOP_DURATION);
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: getAnimationConfig returns correct config based on isMobile flag
   */
  it('getAnimationConfig returns correct config for device type', () => {
    fc.assert(
      fc.property(fc.boolean(), (isMobile) => {
        const config = getAnimationConfig(isMobile);
        
        if (isMobile) {
          expect(config.duration).toBeLessThanOrEqual(MOBILE_MAX_DURATION);
          expect(config.enableHover).toBe(false);
          expect(config.enableComplexTransitions).toBe(false);
        } else {
          expect(config.duration).toBe(DESKTOP_DURATION);
          expect(config.enableHover).toBe(true);
          expect(config.enableComplexTransitions).toBe(true);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: getTransitionDuration returns duration-150 for mobile
   */
  it('getTransitionDuration returns shorter duration for mobile', () => {
    fc.assert(
      fc.property(fc.boolean(), (isMobile) => {
        const durationClass = getTransitionDuration(isMobile);
        
        if (isMobile) {
          expect(durationClass).toBe('duration-150');
        } else {
          expect(durationClass).toBe('duration-200');
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: For any hover class string, getHoverClasses returns empty string on mobile
   */
  it('hover classes are removed on mobile for any hover class input', () => {
    fc.assert(
      fc.property(hoverClassArb, (hoverClass) => {
        const mobileResult = getHoverClasses(hoverClass, true);
        const desktopResult = getHoverClasses(hoverClass, false);
        
        // Mobile should have no hover classes
        expect(mobileResult).toBe('');
        
        // Desktop should preserve hover classes
        expect(desktopResult).toBe(hoverClass);
        
        return mobileResult === '' && desktopResult === hoverClass;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: buildAnimationClasses excludes hover classes on mobile
   */
  it('buildAnimationClasses excludes hover classes on mobile', () => {
    fc.assert(
      fc.property(
        baseClassArb,
        hoverClassArb,
        transitionClassArb,
        (base, hover, transition) => {
          const mobileClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: true,
          });
          
          const desktopClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: false,
          });
          
          // Mobile should NOT contain hover classes
          expect(mobileClasses).not.toContain(hover);
          
          // Desktop should contain hover classes
          expect(desktopClasses).toContain(hover);
          
          return !mobileClasses.includes(hover) && desktopClasses.includes(hover);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: buildAnimationClasses uses duration-150 on mobile
   */
  it('buildAnimationClasses uses shorter duration on mobile', () => {
    fc.assert(
      fc.property(
        baseClassArb,
        hoverClassArb,
        transitionClassArb,
        (base, hover, transition) => {
          const mobileClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: true,
          });
          
          const desktopClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: false,
          });
          
          // Mobile should use duration-150
          expect(mobileClasses).toContain('duration-150');
          expect(mobileClasses).not.toContain('duration-200');
          
          // Desktop should use duration-200
          expect(desktopClasses).toContain('duration-200');
          expect(desktopClasses).not.toContain('duration-150');
          
          return (
            mobileClasses.includes('duration-150') &&
            !mobileClasses.includes('duration-200') &&
            desktopClasses.includes('duration-200') &&
            !desktopClasses.includes('duration-150')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: buildAnimationClasses preserves base and transition classes on both devices
   */
  it('buildAnimationClasses preserves base and transition classes on both devices', () => {
    fc.assert(
      fc.property(
        baseClassArb,
        hoverClassArb,
        transitionClassArb,
        (base, hover, transition) => {
          const mobileClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: true,
          });
          
          const desktopClasses = buildAnimationClasses({
            base,
            hover,
            transition,
            isMobile: false,
          });
          
          // Both should contain base classes
          expect(mobileClasses).toContain(base);
          expect(desktopClasses).toContain(base);
          
          // Both should contain transition classes
          expect(mobileClasses).toContain(transition);
          expect(desktopClasses).toContain(transition);
          
          return (
            mobileClasses.includes(base) &&
            desktopClasses.includes(base) &&
            mobileClasses.includes(transition) &&
            desktopClasses.includes(transition)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: Mobile duration is strictly less than desktop duration
   */
  it('mobile duration is strictly less than desktop duration', () => {
    const mobileConfig = getAnimationConfig(true);
    const desktopConfig = getAnimationConfig(false);
    
    expect(mobileConfig.duration).toBeLessThan(desktopConfig.duration);
  });

  /**
   * **Feature: mobile-responsiveness, Property 7: Animations disabled in mobile**
   * **Validates: Requirements 6.1**
   * 
   * Property: Animation config is deterministic for same device type
   */
  it('animation config is deterministic for same device type', () => {
    fc.assert(
      fc.property(fc.boolean(), (isMobile) => {
        const config1 = getAnimationConfig(isMobile);
        const config2 = getAnimationConfig(isMobile);
        
        expect(config1.duration).toBe(config2.duration);
        expect(config1.enableHover).toBe(config2.enableHover);
        expect(config1.enableComplexTransitions).toBe(config2.enableComplexTransitions);
        
        return (
          config1.duration === config2.duration &&
          config1.enableHover === config2.enableHover &&
          config1.enableComplexTransitions === config2.enableComplexTransitions
        );
      }),
      { numRuns: 100 }
    );
  });
});
