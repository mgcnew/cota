/**
 * Property-Based Tests for Reduced Motion Respect
 * 
 * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
 * **Validates: Requirements 11.2**
 * 
 * Tests that for any animated element, when the user has prefers-reduced-motion enabled,
 * non-essential animations SHALL be disabled.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  reducedMotionClasses,
  buildAccessibleAnimationClass,
  prefersReducedMotion,
  getAccessibleAnimationConfig,
  buildAnimationClass,
} from '../cssAnimations';

/**
 * Arbitrary generator for animation types
 */
const animationTypeArb = fc.constantFrom('hover', 'transition', 'modal') as fc.Arbitrary<'hover' | 'transition' | 'modal'>;

/**
 * Arbitrary generator for animation effects
 */
const animationEffectArb = fc.constantFrom('scale', 'lift', 'fade', 'scale-fade') as fc.Arbitrary<'scale' | 'lift' | 'fade' | 'scale-fade'>;

/**
 * Mock for window.matchMedia
 */
function mockMatchMedia(prefersReducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('Reduced Motion Respect - Property Tests', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: reducedMotionClasses contains all necessary classes for disabling animations
   */
  it('reducedMotionClasses contains all necessary classes for disabling animations', () => {
    // Verify all required reduced motion classes exist
    expect(reducedMotionClasses.motionReduce).toBeDefined();
    expect(reducedMotionClasses.motionReduceTransition).toBeDefined();
    expect(reducedMotionClasses.motionReduceTransform).toBeDefined();
    expect(reducedMotionClasses.motionReduceAll).toBeDefined();
    expect(reducedMotionClasses.motionSafe).toBeDefined();
    
    // Verify motionReduceAll contains all disable classes
    expect(reducedMotionClasses.motionReduceAll).toContain('motion-reduce:transition-none');
    expect(reducedMotionClasses.motionReduceAll).toContain('motion-reduce:transform-none');
    expect(reducedMotionClasses.motionReduceAll).toContain('motion-reduce:animate-none');
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: For any animation type and effect, buildAccessibleAnimationClass with
   * respectReducedMotion=true includes motion-reduce classes
   */
  it('buildAccessibleAnimationClass includes motion-reduce classes when respectReducedMotion is true', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        fc.boolean(),
        (type, effect, includeActive) => {
          const classes = buildAccessibleAnimationClass({
            type,
            effect,
            includeActive,
            respectReducedMotion: true,
          });
          
          // Should include the motion-reduce classes
          expect(classes).toContain('motion-reduce:transition-none');
          expect(classes).toContain('motion-reduce:transform-none');
          expect(classes).toContain('motion-reduce:animate-none');
          
          return (
            classes.includes('motion-reduce:transition-none') &&
            classes.includes('motion-reduce:transform-none') &&
            classes.includes('motion-reduce:animate-none')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: For any animation type and effect, buildAccessibleAnimationClass with
   * respectReducedMotion=false does NOT include motion-reduce classes
   */
  it('buildAccessibleAnimationClass excludes motion-reduce classes when respectReducedMotion is false', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        fc.boolean(),
        (type, effect, includeActive) => {
          const classes = buildAccessibleAnimationClass({
            type,
            effect,
            includeActive,
            respectReducedMotion: false,
          });
          
          // Should NOT include the motion-reduce classes
          expect(classes).not.toContain('motion-reduce:transition-none');
          expect(classes).not.toContain('motion-reduce:transform-none');
          expect(classes).not.toContain('motion-reduce:animate-none');
          
          return (
            !classes.includes('motion-reduce:transition-none') &&
            !classes.includes('motion-reduce:transform-none') &&
            !classes.includes('motion-reduce:animate-none')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: buildAccessibleAnimationClass defaults to respectReducedMotion=true
   */
  it('buildAccessibleAnimationClass defaults to respectReducedMotion=true', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        (type, effect) => {
          // Call without specifying respectReducedMotion
          const classes = buildAccessibleAnimationClass({
            type,
            effect,
          });
          
          // Should include motion-reduce classes by default
          expect(classes).toContain('motion-reduce:transition-none');
          
          return classes.includes('motion-reduce:transition-none');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: buildAccessibleAnimationClass still includes base animation classes
   * even when respectReducedMotion is true (CSS handles the disabling)
   */
  it('buildAccessibleAnimationClass includes base animation classes alongside motion-reduce', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        (type, effect) => {
          const accessibleClasses = buildAccessibleAnimationClass({
            type,
            effect,
            respectReducedMotion: true,
          });
          
          const baseClasses = buildAnimationClass({
            type,
            effect,
          });
          
          // All base classes should be present in accessible version
          const baseClassList = baseClasses.split(' ');
          const allBaseClassesPresent = baseClassList.every(cls => 
            accessibleClasses.includes(cls)
          );
          
          expect(allBaseClassesPresent).toBe(true);
          
          return allBaseClassesPresent;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: prefersReducedMotion returns true when user prefers reduced motion
   */
  it('prefersReducedMotion returns true when user prefers reduced motion', () => {
    window.matchMedia = mockMatchMedia(true);
    
    const result = prefersReducedMotion();
    expect(result).toBe(true);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: prefersReducedMotion returns false when user does not prefer reduced motion
   */
  it('prefersReducedMotion returns false when user does not prefer reduced motion', () => {
    window.matchMedia = mockMatchMedia(false);
    
    const result = prefersReducedMotion();
    expect(result).toBe(false);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: getAccessibleAnimationConfig disables all animations when reduced motion is preferred
   */
  it('getAccessibleAnimationConfig disables all animations when reduced motion is preferred', () => {
    window.matchMedia = mockMatchMedia(true);
    
    fc.assert(
      fc.property(fc.boolean(), (isMobile) => {
        const config = getAccessibleAnimationConfig(isMobile);
        
        // All animation-related properties should be disabled
        expect(config.duration).toBe(0);
        expect(config.enableHover).toBe(false);
        expect(config.enableTransitions).toBe(false);
        expect(config.enableAnimations).toBe(false);
        
        return (
          config.duration === 0 &&
          config.enableHover === false &&
          config.enableTransitions === false &&
          config.enableAnimations === false
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: getAccessibleAnimationConfig enables animations when reduced motion is not preferred
   */
  it('getAccessibleAnimationConfig enables animations when reduced motion is not preferred', () => {
    window.matchMedia = mockMatchMedia(false);
    
    fc.assert(
      fc.property(fc.boolean(), (isMobile) => {
        const config = getAccessibleAnimationConfig(isMobile);
        
        // Animations should be enabled
        expect(config.duration).toBeGreaterThan(0);
        expect(config.enableTransitions).toBe(true);
        expect(config.enableAnimations).toBe(true);
        
        // Hover is disabled on mobile, enabled on desktop
        expect(config.enableHover).toBe(!isMobile);
        
        return (
          config.duration > 0 &&
          config.enableTransitions === true &&
          config.enableAnimations === true &&
          config.enableHover === !isMobile
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: Reduced motion preference completely disables animation duration
   */
  it('reduced motion preference sets animation duration to zero', () => {
    window.matchMedia = mockMatchMedia(true);
    
    const mobileConfig = getAccessibleAnimationConfig(true);
    const desktopConfig = getAccessibleAnimationConfig(false);
    
    // Both mobile and desktop should have zero duration when reduced motion is preferred
    expect(mobileConfig.duration).toBe(0);
    expect(desktopConfig.duration).toBe(0);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: Motion-reduce classes use Tailwind's motion-reduce: prefix
   */
  it('motion-reduce classes use correct Tailwind prefix', () => {
    // All motion-reduce classes should use the motion-reduce: prefix
    expect(reducedMotionClasses.motionReduceTransition).toMatch(/^motion-reduce:/);
    expect(reducedMotionClasses.motionReduceTransform).toMatch(/^motion-reduce:/);
    
    // motionReduceAll should contain multiple motion-reduce: prefixed classes
    const allClasses = reducedMotionClasses.motionReduceAll.split(' ');
    const allHavePrefix = allClasses.every(cls => cls.startsWith('motion-reduce:'));
    expect(allHavePrefix).toBe(true);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: Motion-safe classes exist for conditional animation enabling
   */
  it('motion-safe classes exist for conditional animation enabling', () => {
    expect(reducedMotionClasses.motionSafe).toBeDefined();
    expect(reducedMotionClasses.motionSafeAnimate).toBeDefined();
    expect(reducedMotionClasses.motionSafeTransition).toBeDefined();
    
    // Motion-safe classes should use the motion-safe: prefix
    expect(reducedMotionClasses.motionSafeAnimate).toMatch(/^motion-safe:/);
    expect(reducedMotionClasses.motionSafeTransition).toMatch(/^motion-safe:/);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 12: Reduced Motion Respect**
   * **Validates: Requirements 11.2**
   * 
   * Property: Animation config is deterministic for the same inputs
   */
  it('animation config is deterministic for the same reduced motion preference', () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (prefersReduced, isMobile) => {
        window.matchMedia = mockMatchMedia(prefersReduced);
        
        const config1 = getAccessibleAnimationConfig(isMobile);
        const config2 = getAccessibleAnimationConfig(isMobile);
        
        expect(config1.duration).toBe(config2.duration);
        expect(config1.enableHover).toBe(config2.enableHover);
        expect(config1.enableTransitions).toBe(config2.enableTransitions);
        expect(config1.enableAnimations).toBe(config2.enableAnimations);
        
        return (
          config1.duration === config2.duration &&
          config1.enableHover === config2.enableHover &&
          config1.enableTransitions === config2.enableTransitions &&
          config1.enableAnimations === config2.enableAnimations
        );
      }),
      { numRuns: 100 }
    );
  });
});
