/**
 * Touch Target Utilities
 * 
 * Provides utilities for ensuring minimum touch target sizes (44x44px)
 * for accessible mobile interactions.
 * 
 * Requirements: 2.5, 18.1
 * - Minimum 44x44px touch targets for all interactive elements
 * - Apply to buttons and interactive elements
 */

/**
 * Minimum touch target size in pixels (WCAG 2.1 AAA recommendation)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * Touch target CSS class names
 */
export const touchTargetClasses = {
  /** Base touch target - ensures minimum 44x44px */
  base: 'touch-target',
  
  /** Touch target with centered content */
  centered: 'touch-target-centered',
  
  /** Touch target for icon buttons */
  icon: 'touch-target-icon',
  
  /** Touch target for list items */
  listItem: 'touch-target-list-item',
  
  /** Touch target with expanded hit area (invisible padding) */
  expanded: 'touch-target-expanded',
  
  /** Touch target for inline elements */
  inline: 'touch-target-inline',
  
  /** Touch target for small buttons that need larger hit area */
  small: 'touch-target-small',
} as const;

/**
 * Get touch target class based on element type
 */
export function getTouchTargetClass(
  elementType: 'button' | 'icon' | 'listItem' | 'link' | 'checkbox' | 'radio' | 'switch'
): string {
  switch (elementType) {
    case 'button':
      return touchTargetClasses.base;
    case 'icon':
      return touchTargetClasses.icon;
    case 'listItem':
      return touchTargetClasses.listItem;
    case 'link':
      return touchTargetClasses.inline;
    case 'checkbox':
    case 'radio':
    case 'switch':
      return touchTargetClasses.expanded;
    default:
      return touchTargetClasses.base;
  }
}

/**
 * Calculate padding needed to achieve minimum touch target size
 * @param contentSize - The size of the content in pixels
 * @returns The padding needed on each side
 */
export function calculateTouchPadding(contentSize: number): number {
  if (contentSize >= MIN_TOUCH_TARGET_SIZE) {
    return 0;
  }
  return Math.ceil((MIN_TOUCH_TARGET_SIZE - contentSize) / 2);
}

/**
 * Check if an element meets minimum touch target requirements
 * @param width - Element width in pixels
 * @param height - Element height in pixels
 * @returns Whether the element meets minimum touch target size
 */
export function meetsMinTouchTarget(width: number, height: number): boolean {
  return width >= MIN_TOUCH_TARGET_SIZE && height >= MIN_TOUCH_TARGET_SIZE;
}

/**
 * Get inline styles for touch target sizing
 * Useful for dynamic sizing when CSS classes aren't sufficient
 */
export function getTouchTargetStyles(options?: {
  minWidth?: number;
  minHeight?: number;
  centered?: boolean;
}): React.CSSProperties {
  const {
    minWidth = MIN_TOUCH_TARGET_SIZE,
    minHeight = MIN_TOUCH_TARGET_SIZE,
    centered = true,
  } = options || {};
  
  const styles: React.CSSProperties = {
    minWidth: `${minWidth}px`,
    minHeight: `${minHeight}px`,
  };
  
  if (centered) {
    styles.display = 'inline-flex';
    styles.alignItems = 'center';
    styles.justifyContent = 'center';
  }
  
  return styles;
}

/**
 * Build touch target class string with optional modifiers
 */
export function buildTouchTargetClass(options?: {
  type?: 'button' | 'icon' | 'listItem' | 'link' | 'checkbox' | 'radio' | 'switch';
  centered?: boolean;
  expanded?: boolean;
}): string {
  const { type = 'button', centered = true, expanded = false } = options || {};
  
  const classes: string[] = [getTouchTargetClass(type)];
  
  if (centered && type !== 'listItem') {
    classes.push(touchTargetClasses.centered);
  }
  
  if (expanded) {
    classes.push(touchTargetClasses.expanded);
  }
  
  return classes.join(' ');
}
