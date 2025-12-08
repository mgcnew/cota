/**
 * Responsive Typography Utilities
 * 
 * Provides typography configuration and utilities for responsive font sizing.
 * Ensures proper font sizes across mobile, tablet, and desktop breakpoints.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 * - Body text: minimum 14px on mobile with line-height 1.5
 * - Headings: 20% reduced scale on mobile
 * - Labels: minimum 12px
 * - Monetary values: tabular font for consistent alignment
 */

/**
 * Typography scale configuration
 * All values in pixels
 */
export const TYPOGRAPHY_CONFIG = {
  mobile: {
    body: {
      fontSize: 16, // minimum 16px - Requirement 18.3
      lineHeight: 1.5,
    },
    heading1: {
      fontSize: 38, // 20% smaller than desktop 48px * 0.8 = 38.4, rounded to 38px
      lineHeight: 1.2,
      fontWeight: 700,
    },
    heading2: {
      fontSize: 29, // 20% smaller than desktop 36px * 0.8 = 28.8, rounded to 29px
      lineHeight: 1.25,
      fontWeight: 700,
    },
    heading3: {
      fontSize: 24, // 20% smaller than desktop 30px * 0.8 = 24
      lineHeight: 1.3,
      fontWeight: 600,
    },
    heading4: {
      fontSize: 19, // 20% smaller than desktop 24px * 0.8 = 19.2, rounded to 19px
      lineHeight: 1.3,
      fontWeight: 600,
    },
    label: {
      fontSize: 12, // minimum 12px - Requirement 8.3
      lineHeight: 1.4,
      fontWeight: 500,
    },
    caption: {
      fontSize: 12, // minimum 12px
      lineHeight: 1.4,
    },
  },
  tablet: {
    body: {
      fontSize: 16,
      lineHeight: 1.5,
    },
    heading1: {
      fontSize: 36,
      lineHeight: 1.2,
      fontWeight: 700,
    },
    heading2: {
      fontSize: 30,
      lineHeight: 1.25,
      fontWeight: 700,
    },
    heading3: {
      fontSize: 24,
      lineHeight: 1.3,
      fontWeight: 600,
    },
    heading4: {
      fontSize: 20,
      lineHeight: 1.3,
      fontWeight: 600,
    },
    label: {
      fontSize: 14,
      lineHeight: 1.4,
      fontWeight: 500,
    },
    caption: {
      fontSize: 12,
      lineHeight: 1.4,
    },
  },
  desktop: {
    body: {
      fontSize: 16,
      lineHeight: 1.5,
    },
    heading1: {
      fontSize: 48,
      lineHeight: 1.2,
      fontWeight: 700,
    },
    heading2: {
      fontSize: 36,
      lineHeight: 1.25,
      fontWeight: 700,
    },
    heading3: {
      fontSize: 30,
      lineHeight: 1.3,
      fontWeight: 600,
    },
    heading4: {
      fontSize: 24,
      lineHeight: 1.3,
      fontWeight: 600,
    },
    label: {
      fontSize: 14,
      lineHeight: 1.4,
      fontWeight: 500,
    },
    caption: {
      fontSize: 12,
      lineHeight: 1.4,
    },
  },
} as const;

/**
 * Minimum font size requirements
 */
export const MIN_FONT_SIZES = {
  body: 16, // Requirement 18.3 - minimum 16px for body text on mobile
  label: 12, // Requirement 8.3
  caption: 12,
} as const;

/**
 * Heading scale reduction factor for mobile
 * Requirement 8.2: Headings reduced by 20% on mobile
 */
export const MOBILE_HEADING_SCALE_FACTOR = 0.8; // 20% reduction

/**
 * Breakpoint thresholds in pixels
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640, // sm breakpoint
  desktop: 1024, // lg breakpoint
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type TextType = 'body' | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'label' | 'caption';

/**
 * Get the current breakpoint based on screen width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) {
    return 'desktop';
  }
  if (width >= BREAKPOINTS.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

/**
 * Get typography configuration for a specific breakpoint
 */
export function getTypographyConfig(breakpoint: Breakpoint) {
  return TYPOGRAPHY_CONFIG[breakpoint];
}

/**
 * Get font size for a specific text type and breakpoint
 */
export function getFontSize(textType: TextType, breakpoint: Breakpoint): number {
  return TYPOGRAPHY_CONFIG[breakpoint][textType].fontSize;
}

/**
 * Check if font size meets minimum requirements
 */
export function meetsMinimumFontSize(textType: TextType, fontSize: number): boolean {
  if (textType === 'body') {
    return fontSize >= MIN_FONT_SIZES.body;
  }
  if (textType === 'label' || textType === 'caption') {
    return fontSize >= MIN_FONT_SIZES.label;
  }
  // Headings don't have a minimum, but should be larger than body
  return fontSize >= MIN_FONT_SIZES.body;
}

/**
 * Calculate expected mobile heading size from desktop size
 * Applies 20% reduction as per Requirement 8.2
 */
export function calculateMobileHeadingSize(desktopSize: number): number {
  return Math.round(desktopSize * MOBILE_HEADING_SCALE_FACTOR);
}

/**
 * Verify heading scale reduction between mobile and desktop
 * Returns true if mobile heading is approximately 20% smaller than desktop
 */
export function verifyHeadingScaleReduction(
  mobileSize: number,
  desktopSize: number,
  tolerance: number = 0.05 // 5% tolerance for rounding
): boolean {
  const expectedMobileSize = desktopSize * MOBILE_HEADING_SCALE_FACTOR;
  const actualRatio = mobileSize / desktopSize;
  const expectedRatio = MOBILE_HEADING_SCALE_FACTOR;
  
  return Math.abs(actualRatio - expectedRatio) <= tolerance;
}

/**
 * Get CSS class name for responsive typography
 */
export function getTypographyClassName(textType: TextType): string {
  const classMap: Record<TextType, string> = {
    body: 'text-body-responsive',
    heading1: 'text-h1-responsive',
    heading2: 'text-h2-responsive',
    heading3: 'text-h3-responsive',
    heading4: 'text-h4-responsive',
    label: 'text-label-responsive',
    caption: 'text-caption-responsive',
  };
  
  return classMap[textType];
}

/**
 * Check if a text type is a heading
 */
export function isHeading(textType: TextType): boolean {
  return textType.startsWith('heading');
}

/**
 * Monetary text configuration
 * Requirement 8.5: Tabular font for consistent alignment
 */
export const MONETARY_CONFIG = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
} as const;

/**
 * Get monetary text CSS properties
 */
export function getMonetaryTextStyles(): { fontVariantNumeric: string; fontFeatureSettings: string } {
  return {
    fontVariantNumeric: MONETARY_CONFIG.fontVariantNumeric,
    fontFeatureSettings: MONETARY_CONFIG.fontFeatureSettings,
  };
}
