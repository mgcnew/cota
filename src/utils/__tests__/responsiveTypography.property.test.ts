/**
 * Property-Based Tests for Responsive Typography
 * 
 * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
 * **Validates: Requirements 8.1, 8.2, 8.3**
 * 
 * Tests that for any text element rendered in mobile context:
 * - Body text has minimum font-size of 14px
 * - Headings are scaled down by 20% from desktop
 * - Labels have minimum font-size of 12px
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  TYPOGRAPHY_CONFIG,
  MIN_FONT_SIZES,
  MOBILE_HEADING_SCALE_FACTOR,
  BREAKPOINTS,
  getBreakpoint,
  getTypographyConfig,
  getFontSize,
  meetsMinimumFontSize,
  calculateMobileHeadingSize,
  verifyHeadingScaleReduction,
  getTypographyClassName,
  isHeading,
  getMonetaryTextStyles,
  MONETARY_CONFIG,
  type Breakpoint,
  type TextType,
} from '../responsiveTypography';

/**
 * Arbitrary generators
 */
const breakpointArb = fc.constantFrom<Breakpoint>('mobile', 'tablet', 'desktop');
const textTypeArb = fc.constantFrom<TextType>('body', 'heading1', 'heading2', 'heading3', 'heading4', 'label', 'caption');
const headingTypeArb = fc.constantFrom<TextType>('heading1', 'heading2', 'heading3', 'heading4');
const bodyLabelTypeArb = fc.constantFrom<TextType>('body', 'label', 'caption');

// Screen width generator - realistic range from small mobile to large desktop
const screenWidthArb = fc.integer({ min: 320, max: 1920 });

// Mobile screen width (< 640px)
const mobileWidthArb = fc.integer({ min: 320, max: 639 });

// Tablet screen width (640px - 1023px)
const tabletWidthArb = fc.integer({ min: 640, max: 1023 });

// Desktop screen width (>= 1024px)
const desktopWidthArb = fc.integer({ min: 1024, max: 1920 });

describe('Responsive Typography - Property Tests', () => {
  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1**
   * 
   * Property: Body text has minimum font-size of 14px on mobile
   */
  it('body text has minimum 14px font size on mobile', () => {
    const mobileBodySize = TYPOGRAPHY_CONFIG.mobile.body.fontSize;
    
    expect(mobileBodySize).toBeGreaterThanOrEqual(MIN_FONT_SIZES.body);
    expect(mobileBodySize).toBe(14);
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1**
   * 
   * Property: Body text line-height is 1.5 on mobile
   */
  it('body text has line-height of 1.5 on mobile', () => {
    const mobileBodyLineHeight = TYPOGRAPHY_CONFIG.mobile.body.lineHeight;
    
    expect(mobileBodyLineHeight).toBe(1.5);
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1**
   * 
   * Property: For any breakpoint, body text meets minimum font size requirement
   */
  it('body text meets minimum font size for all breakpoints', () => {
    fc.assert(
      fc.property(breakpointArb, (breakpoint) => {
        const bodySize = getFontSize('body', breakpoint);
        
        expect(bodySize).toBeGreaterThanOrEqual(MIN_FONT_SIZES.body);
        
        return bodySize >= MIN_FONT_SIZES.body;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.3**
   * 
   * Property: Labels have minimum font-size of 12px
   */
  it('labels have minimum 12px font size on mobile', () => {
    const mobileLabelSize = TYPOGRAPHY_CONFIG.mobile.label.fontSize;
    
    expect(mobileLabelSize).toBeGreaterThanOrEqual(MIN_FONT_SIZES.label);
    expect(mobileLabelSize).toBe(12);
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.3**
   * 
   * Property: For any breakpoint, labels meet minimum font size requirement
   */
  it('labels meet minimum font size for all breakpoints', () => {
    fc.assert(
      fc.property(breakpointArb, (breakpoint) => {
        const labelSize = getFontSize('label', breakpoint);
        
        expect(labelSize).toBeGreaterThanOrEqual(MIN_FONT_SIZES.label);
        
        return labelSize >= MIN_FONT_SIZES.label;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.2**
   * 
   * Property: Headings are scaled down by approximately 20% on mobile compared to desktop
   */
  it('headings are scaled down by 20% on mobile compared to desktop', () => {
    fc.assert(
      fc.property(headingTypeArb, (headingType) => {
        const mobileSize = getFontSize(headingType, 'mobile');
        const desktopSize = getFontSize(headingType, 'desktop');
        
        // Mobile should be smaller than desktop
        expect(mobileSize).toBeLessThan(desktopSize);
        
        // Verify approximately 20% reduction (with 10% tolerance for rounding)
        const isScaledCorrectly = verifyHeadingScaleReduction(mobileSize, desktopSize, 0.1);
        expect(isScaledCorrectly).toBe(true);
        
        return mobileSize < desktopSize && isScaledCorrectly;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.2**
   * 
   * Property: Mobile heading scale factor is 0.8 (20% reduction)
   */
  it('mobile heading scale factor is 0.8', () => {
    expect(MOBILE_HEADING_SCALE_FACTOR).toBe(0.8);
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: For non-heading text types, font sizes increase or stay same from mobile to desktop
   * Note: Headings follow a different rule (20% reduction from desktop) per Requirement 8.2
   */
  it('non-heading font sizes are monotonically non-decreasing from mobile to desktop', () => {
    fc.assert(
      fc.property(bodyLabelTypeArb, (textType) => {
        const mobileSize = getFontSize(textType, 'mobile');
        const tabletSize = getFontSize(textType, 'tablet');
        const desktopSize = getFontSize(textType, 'desktop');
        
        // Mobile <= Tablet <= Desktop for body, label, caption
        expect(mobileSize).toBeLessThanOrEqual(tabletSize);
        expect(tabletSize).toBeLessThanOrEqual(desktopSize);
        
        return mobileSize <= tabletSize && tabletSize <= desktopSize;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: For any screen width, getBreakpoint returns correct breakpoint
   */
  it('getBreakpoint returns correct breakpoint for any screen width', () => {
    fc.assert(
      fc.property(screenWidthArb, (width) => {
        const breakpoint = getBreakpoint(width);
        
        if (width >= BREAKPOINTS.desktop) {
          expect(breakpoint).toBe('desktop');
          return breakpoint === 'desktop';
        } else if (width >= BREAKPOINTS.tablet) {
          expect(breakpoint).toBe('tablet');
          return breakpoint === 'tablet';
        } else {
          expect(breakpoint).toBe('mobile');
          return breakpoint === 'mobile';
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: For any mobile screen width, body text is at least 14px
   */
  it('body text is at least 14px for any mobile screen width', () => {
    fc.assert(
      fc.property(mobileWidthArb, (width) => {
        const breakpoint = getBreakpoint(width);
        expect(breakpoint).toBe('mobile');
        
        const bodySize = getFontSize('body', breakpoint);
        expect(bodySize).toBeGreaterThanOrEqual(14);
        
        return bodySize >= 14;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.3**
   * 
   * Property: For any mobile screen width, labels are at least 12px
   */
  it('labels are at least 12px for any mobile screen width', () => {
    fc.assert(
      fc.property(mobileWidthArb, (width) => {
        const breakpoint = getBreakpoint(width);
        expect(breakpoint).toBe('mobile');
        
        const labelSize = getFontSize('label', breakpoint);
        expect(labelSize).toBeGreaterThanOrEqual(12);
        
        return labelSize >= 12;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: meetsMinimumFontSize correctly validates font sizes
   */
  it('meetsMinimumFontSize correctly validates font sizes', () => {
    fc.assert(
      fc.property(
        textTypeArb,
        fc.integer({ min: 8, max: 72 }),
        (textType, fontSize) => {
          const meets = meetsMinimumFontSize(textType, fontSize);
          
          if (textType === 'body') {
            expect(meets).toBe(fontSize >= MIN_FONT_SIZES.body);
            return meets === (fontSize >= MIN_FONT_SIZES.body);
          } else if (textType === 'label' || textType === 'caption') {
            expect(meets).toBe(fontSize >= MIN_FONT_SIZES.label);
            return meets === (fontSize >= MIN_FONT_SIZES.label);
          } else {
            // Headings should be at least body size
            expect(meets).toBe(fontSize >= MIN_FONT_SIZES.body);
            return meets === (fontSize >= MIN_FONT_SIZES.body);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.2**
   * 
   * Property: calculateMobileHeadingSize applies 20% reduction
   */
  it('calculateMobileHeadingSize applies 20% reduction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 16, max: 72 }),
        (desktopSize) => {
          const mobileSize = calculateMobileHeadingSize(desktopSize);
          const expectedSize = Math.round(desktopSize * 0.8);
          
          expect(mobileSize).toBe(expectedSize);
          
          return mobileSize === expectedSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: Typography config is consistent across all breakpoints
   */
  it('typography config has all required text types for all breakpoints', () => {
    fc.assert(
      fc.property(breakpointArb, textTypeArb, (breakpoint, textType) => {
        const config = getTypographyConfig(breakpoint);
        
        expect(config).toBeDefined();
        expect(config[textType]).toBeDefined();
        expect(config[textType].fontSize).toBeGreaterThan(0);
        expect(config[textType].lineHeight).toBeGreaterThan(0);
        
        return (
          config !== undefined &&
          config[textType] !== undefined &&
          config[textType].fontSize > 0 &&
          config[textType].lineHeight > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: getTypographyClassName returns valid class name for all text types
   */
  it('getTypographyClassName returns valid class name for all text types', () => {
    fc.assert(
      fc.property(textTypeArb, (textType) => {
        const className = getTypographyClassName(textType);
        
        expect(className).toBeDefined();
        expect(className.length).toBeGreaterThan(0);
        expect(className).toMatch(/^text-/);
        
        return className !== undefined && className.length > 0 && className.startsWith('text-');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.2**
   * 
   * Property: isHeading correctly identifies heading types
   */
  it('isHeading correctly identifies heading types', () => {
    fc.assert(
      fc.property(textTypeArb, (textType) => {
        const result = isHeading(textType);
        const expected = textType.startsWith('heading');
        
        expect(result).toBe(expected);
        
        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.5**
   * 
   * Property: Monetary text uses tabular-nums font variant
   */
  it('monetary text uses tabular-nums font variant', () => {
    const styles = getMonetaryTextStyles();
    
    expect(styles.fontVariantNumeric).toBe('tabular-nums');
    expect(styles.fontFeatureSettings).toBe('"tnum"');
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.1, 8.2, 8.3**
   * 
   * Property: All mobile font sizes meet their respective minimums
   */
  it('all mobile font sizes meet their respective minimums', () => {
    const mobileConfig = TYPOGRAPHY_CONFIG.mobile;
    
    // Body text minimum 14px
    expect(mobileConfig.body.fontSize).toBeGreaterThanOrEqual(14);
    
    // Labels minimum 12px
    expect(mobileConfig.label.fontSize).toBeGreaterThanOrEqual(12);
    
    // Caption minimum 12px
    expect(mobileConfig.caption.fontSize).toBeGreaterThanOrEqual(12);
    
    // Headings should be larger than body
    expect(mobileConfig.heading1.fontSize).toBeGreaterThan(mobileConfig.body.fontSize);
    expect(mobileConfig.heading2.fontSize).toBeGreaterThan(mobileConfig.body.fontSize);
    expect(mobileConfig.heading3.fontSize).toBeGreaterThan(mobileConfig.body.fontSize);
    expect(mobileConfig.heading4.fontSize).toBeGreaterThan(mobileConfig.body.fontSize);
  });

  /**
   * **Feature: mobile-responsiveness, Property 8: Font sizes respect mobile scale**
   * **Validates: Requirements 8.2**
   * 
   * Property: Heading hierarchy is maintained (h1 > h2 > h3 > h4)
   */
  it('heading hierarchy is maintained across all breakpoints', () => {
    fc.assert(
      fc.property(breakpointArb, (breakpoint) => {
        const h1 = getFontSize('heading1', breakpoint);
        const h2 = getFontSize('heading2', breakpoint);
        const h3 = getFontSize('heading3', breakpoint);
        const h4 = getFontSize('heading4', breakpoint);
        
        expect(h1).toBeGreaterThan(h2);
        expect(h2).toBeGreaterThan(h3);
        expect(h3).toBeGreaterThan(h4);
        
        return h1 > h2 && h2 > h3 && h3 > h4;
      }),
      { numRuns: 100 }
    );
  });
});
