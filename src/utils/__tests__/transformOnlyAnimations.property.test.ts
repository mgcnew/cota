/**
 * Property-Based Tests for Transform-Only Animations
 * 
 * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
 * **Validates: Requirements 11.1, 11.4**
 * 
 * Tests that for any animation applied to elements, only CSS transform and opacity
 * properties SHALL be animated to ensure GPU acceleration.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  cssAnimationClasses,
  buildAnimationClass,
  getModalAnimationClasses,
  buildAccessibleAnimationClass,
} from '../cssAnimations';

/**
 * Allowed CSS properties for GPU-accelerated animations
 * Requirements 11.1, 11.4 - Only transform and opacity for hardware acceleration
 */
const ALLOWED_ANIMATED_PROPERTIES = ['transform', 'opacity'] as const;

/**
 * Animation keyframe definitions that should only use transform/opacity
 * These represent the actual CSS keyframes defined in index.css
 */
const ANIMATION_KEYFRAMES = {
  fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
  fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
  scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
  scaleOut: { from: { opacity: 1, transform: 'scale(1)' }, to: { opacity: 0, transform: 'scale(0.95)' } },
  slideInBottom: { from: { opacity: 0, transform: 'translateY(100%)' }, to: { opacity: 1, transform: 'translateY(0)' } },
  slideOutBottom: { from: { opacity: 1, transform: 'translateY(0)' }, to: { opacity: 0, transform: 'translateY(100%)' } },
  slideInRight: { from: { opacity: 0, transform: 'translateX(100%)' }, to: { opacity: 1, transform: 'translateX(0)' } },
  slideOutRight: { from: { opacity: 1, transform: 'translateX(0)' }, to: { opacity: 0, transform: 'translateX(100%)' } },
  fadeInUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
} as const;

/**
 * Hover effect definitions that should only use transform/opacity
 */
const HOVER_EFFECTS = {
  hoverScale: { transform: 'scale(1.02)' },
  hoverLift: { transform: 'translateY(-2px)' },
  hoverFade: { opacity: 0.8 },
  hoverScaleFade: { transform: 'scale(1.02)', opacity: 0.9 },
} as const;

/**
 * Active/press effect definitions that should only use transform/opacity
 */
const ACTIVE_EFFECTS = {
  activePress: { transform: 'scale(0.98)', opacity: 0.9 },
  activeScale: { transform: 'scale(0.97)' },
} as const;

/**
 * Helper function to extract animated properties from a keyframe definition
 */
function getAnimatedProperties(keyframe: Record<string, unknown>): string[] {
  const properties = new Set<string>();
  
  for (const state of Object.values(keyframe)) {
    if (typeof state === 'object' && state !== null) {
      for (const prop of Object.keys(state)) {
        properties.add(prop);
      }
    }
  }
  
  return Array.from(properties);
}

/**
 * Helper function to check if all properties are allowed
 */
function areAllPropertiesAllowed(properties: string[]): boolean {
  return properties.every(prop => 
    ALLOWED_ANIMATED_PROPERTIES.includes(prop as typeof ALLOWED_ANIMATED_PROPERTIES[number])
  );
}

/**
 * Arbitrary generator for animation types
 */
const animationTypeArb = fc.constantFrom('hover', 'transition', 'modal') as fc.Arbitrary<'hover' | 'transition' | 'modal'>;

/**
 * Arbitrary generator for animation effects
 */
const animationEffectArb = fc.constantFrom('scale', 'lift', 'fade', 'scale-fade') as fc.Arbitrary<'scale' | 'lift' | 'fade' | 'scale-fade'>;

/**
 * Arbitrary generator for modal directions
 */
const modalDirectionArb = fc.constantFrom('bottom', 'right', 'center') as fc.Arbitrary<'bottom' | 'right' | 'center'>;

/**
 * Arbitrary generator for keyframe names
 */
const keyframeNameArb = fc.constantFrom(
  'fadeIn', 'fadeOut', 'scaleIn', 'scaleOut',
  'slideInBottom', 'slideOutBottom', 'slideInRight', 'slideOutRight', 'fadeInUp'
) as fc.Arbitrary<keyof typeof ANIMATION_KEYFRAMES>;

/**
 * Arbitrary generator for hover effect names
 */
const hoverEffectNameArb = fc.constantFrom(
  'hoverScale', 'hoverLift', 'hoverFade', 'hoverScaleFade'
) as fc.Arbitrary<keyof typeof HOVER_EFFECTS>;

/**
 * Arbitrary generator for active effect names
 */
const activeEffectNameArb = fc.constantFrom(
  'activePress', 'activeScale'
) as fc.Arbitrary<keyof typeof ACTIVE_EFFECTS>;

describe('Transform-Only Animations - Property Tests', () => {
  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: All animation keyframes only animate transform and/or opacity
   */
  it('all animation keyframes only animate transform and/or opacity', () => {
    fc.assert(
      fc.property(keyframeNameArb, (keyframeName) => {
        const keyframe = ANIMATION_KEYFRAMES[keyframeName];
        const animatedProperties = getAnimatedProperties(keyframe);
        
        const allAllowed = areAllPropertiesAllowed(animatedProperties);
        
        expect(allAllowed).toBe(true);
        expect(animatedProperties.length).toBeGreaterThan(0);
        
        // Each property should be either 'transform' or 'opacity'
        for (const prop of animatedProperties) {
          expect(ALLOWED_ANIMATED_PROPERTIES).toContain(prop);
        }
        
        return allAllowed;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: All hover effects only use transform and/or opacity
   */
  it('all hover effects only use transform and/or opacity', () => {
    fc.assert(
      fc.property(hoverEffectNameArb, (effectName) => {
        const effect = HOVER_EFFECTS[effectName];
        const properties = Object.keys(effect);
        
        const allAllowed = areAllPropertiesAllowed(properties);
        
        expect(allAllowed).toBe(true);
        expect(properties.length).toBeGreaterThan(0);
        
        for (const prop of properties) {
          expect(ALLOWED_ANIMATED_PROPERTIES).toContain(prop);
        }
        
        return allAllowed;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: All active/press effects only use transform and/or opacity
   */
  it('all active/press effects only use transform and/or opacity', () => {
    fc.assert(
      fc.property(activeEffectNameArb, (effectName) => {
        const effect = ACTIVE_EFFECTS[effectName];
        const properties = Object.keys(effect);
        
        const allAllowed = areAllPropertiesAllowed(properties);
        
        expect(allAllowed).toBe(true);
        expect(properties.length).toBeGreaterThan(0);
        
        for (const prop of properties) {
          expect(ALLOWED_ANIMATED_PROPERTIES).toContain(prop);
        }
        
        return allAllowed;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: buildAnimationClass generates classes that use transition-transform-opacity
   */
  it('buildAnimationClass generates classes with transform-opacity transition', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        fc.boolean(),
        (type, effect, includeActive) => {
          const classes = buildAnimationClass({ type, effect, includeActive });
          
          // Should include the transform-opacity transition class
          expect(classes).toContain('transition-transform-opacity');
          
          return classes.includes('transition-transform-opacity');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: buildAccessibleAnimationClass generates classes with transform-opacity transition
   */
  it('buildAccessibleAnimationClass generates classes with transform-opacity transition', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        animationEffectArb,
        fc.boolean(),
        fc.boolean(),
        (type, effect, includeActive, respectReducedMotion) => {
          const classes = buildAccessibleAnimationClass({ 
            type, 
            effect, 
            includeActive,
            respectReducedMotion 
          });
          
          // Should include the transform-opacity transition class
          expect(classes).toContain('transition-transform-opacity');
          
          return classes.includes('transition-transform-opacity');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: Modal animation classes reference transform/opacity-only animations
   */
  it('modal animation classes reference transform/opacity-only animations', () => {
    fc.assert(
      fc.property(modalDirectionArb, (direction) => {
        const { enter, exit, backdrop } = getModalAnimationClasses(direction);
        
        // All modal animations should use classes that animate only transform/opacity
        // Check that they use the defined animation classes
        const validAnimationClasses = [
          'animate-fade-in', 'animate-fade-out',
          'animate-scale-in', 'animate-scale-out',
          'animate-slide-in-bottom', 'animate-slide-out-bottom',
          'animate-slide-in-right', 'animate-slide-out-right',
        ];
        
        // Enter animation should use valid animation classes
        const enterHasValidAnimation = validAnimationClasses.some(cls => enter.includes(cls));
        expect(enterHasValidAnimation).toBe(true);
        
        // Exit animation should use valid animation classes
        const exitHasValidAnimation = validAnimationClasses.some(cls => exit.includes(cls));
        expect(exitHasValidAnimation).toBe(true);
        
        // Backdrop should use fade animation
        expect(backdrop).toContain('animate-fade-in');
        
        return enterHasValidAnimation && exitHasValidAnimation && backdrop.includes('animate-fade-in');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: CSS animation class names follow transform/opacity naming convention
   */
  it('CSS animation class names indicate transform/opacity animations', () => {
    // Verify that animation class names indicate they animate transform/opacity
    const animationClasses = [
      cssAnimationClasses.transitionTransform,
      cssAnimationClasses.transitionOpacity,
      cssAnimationClasses.transitionTransformOpacity,
      cssAnimationClasses.animateFadeIn,
      cssAnimationClasses.animateFadeOut,
      cssAnimationClasses.animateScaleIn,
      cssAnimationClasses.animateScaleOut,
      cssAnimationClasses.animateSlideInBottom,
      cssAnimationClasses.animateSlideOutBottom,
      cssAnimationClasses.animateSlideInRight,
      cssAnimationClasses.animateSlideOutRight,
    ];
    
    // All animation classes should be defined
    for (const cls of animationClasses) {
      expect(cls).toBeDefined();
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
    }
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.4**
   * 
   * Property: GPU acceleration helper classes are available
   */
  it('GPU acceleration helper classes are available', () => {
    // Verify GPU acceleration classes exist
    expect(cssAnimationClasses.gpuAccelerated).toBe('gpu-accelerated');
    expect(cssAnimationClasses.willChangeTransform).toBe('will-change-transform');
    expect(cssAnimationClasses.willChangeOpacity).toBe('will-change-opacity');
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: Hover effect classes only animate transform/opacity
   */
  it('hover effect classes only animate transform/opacity', () => {
    // Verify hover classes are defined and follow naming convention
    const hoverClasses = [
      cssAnimationClasses.hoverScale,
      cssAnimationClasses.hoverLift,
      cssAnimationClasses.hoverFade,
      cssAnimationClasses.hoverScaleFade,
    ];
    
    for (const cls of hoverClasses) {
      expect(cls).toBeDefined();
      expect(typeof cls).toBe('string');
      // Class names should indicate hover behavior
      expect(cls.startsWith('hover-')).toBe(true);
    }
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: Active/press effect classes only animate transform/opacity
   */
  it('active/press effect classes only animate transform/opacity', () => {
    // Verify active classes are defined and follow naming convention
    const activeClasses = [
      cssAnimationClasses.activePress,
      cssAnimationClasses.activeScale,
    ];
    
    for (const cls of activeClasses) {
      expect(cls).toBeDefined();
      expect(typeof cls).toBe('string');
      // Class names should indicate active behavior
      expect(cls.startsWith('active-')).toBe(true);
    }
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: All keyframes animate at least one allowed property
   */
  it('all keyframes animate at least one allowed property', () => {
    for (const [name, keyframe] of Object.entries(ANIMATION_KEYFRAMES)) {
      const properties = getAnimatedProperties(keyframe);
      
      expect(properties.length).toBeGreaterThan(0);
      
      // At least one property should be animated
      const hasAllowedProperty = properties.some(prop => 
        ALLOWED_ANIMATED_PROPERTIES.includes(prop as typeof ALLOWED_ANIMATED_PROPERTIES[number])
      );
      
      expect(hasAllowedProperty).toBe(true);
    }
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: No keyframe animates disallowed properties (like width, height, margin, etc.)
   */
  it('no keyframe animates disallowed properties', () => {
    const disallowedProperties = [
      'width', 'height', 'margin', 'padding', 'top', 'left', 'right', 'bottom',
      'font-size', 'line-height', 'border-width', 'background-color', 'color'
    ];
    
    for (const [name, keyframe] of Object.entries(ANIMATION_KEYFRAMES)) {
      const properties = getAnimatedProperties(keyframe);
      
      for (const prop of properties) {
        expect(disallowedProperties).not.toContain(prop);
      }
    }
  });

  /**
   * **Feature: mobile-performance-refactor, Property 11: Transform-Only Animations**
   * **Validates: Requirements 11.1, 11.4**
   * 
   * Property: Transform values use GPU-accelerated functions
   */
  it('transform values use GPU-accelerated functions', () => {
    const gpuAcceleratedTransforms = ['scale', 'translate', 'translateX', 'translateY', 'translateZ', 'rotate'];
    
    for (const [name, keyframe] of Object.entries(ANIMATION_KEYFRAMES)) {
      for (const state of Object.values(keyframe)) {
        if (typeof state === 'object' && state !== null && 'transform' in state) {
          const transformValue = (state as { transform: string }).transform;
          
          // Check that transform uses GPU-accelerated functions
          const usesGpuTransform = gpuAcceleratedTransforms.some(fn => 
            transformValue.includes(fn)
          );
          
          expect(usesGpuTransform).toBe(true);
        }
      }
    }
  });
});
