import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConditionalRenderProps {
  /**
   * Content to render on mobile devices (width < 768px)
   */
  mobile?: React.ReactNode;
  /**
   * Content to render on desktop/tablet devices (width >= 768px)
   */
  desktop?: React.ReactNode;
  /**
   * Fallback content to render during SSR or when neither mobile nor desktop is provided
   */
  fallback?: React.ReactNode;
}

/**
 * ConditionalRender - Renders only ONE version (mobile OR desktop) based on the current breakpoint.
 * 
 * This component uses the useIsMobile hook to determine which content to render,
 * ensuring that only the appropriate version is in the DOM at any time.
 * This improves performance by avoiding duplicate DOM elements that are hidden via CSS.
 * 
 * @example
 * ```tsx
 * <ConditionalRender
 *   mobile={<MobileCardsList data={items} />}
 *   desktop={<DesktopTable data={items} />}
 * />
 * ```
 * 
 * Requirements: 6.1, 6.5
 */
export function ConditionalRender({ 
  mobile, 
  desktop, 
  fallback = null 
}: ConditionalRenderProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback;
  }
  
  if (isMobile) {
    return mobile ?? fallback;
  }
  
  return desktop ?? fallback;
}

/**
 * MobileOnly - Renders content only on mobile devices (width < 768px)
 * 
 * @example
 * ```tsx
 * <MobileOnly>
 *   <MobileNavigation />
 * </MobileOnly>
 * ```
 */
export function MobileOnly({ children }: { children: React.ReactNode }): React.ReactNode {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isMobile) {
    return null;
  }
  
  return children;
}

/**
 * DesktopOnly - Renders content only on desktop/tablet devices (width >= 768px)
 * 
 * @example
 * ```tsx
 * <DesktopOnly>
 *   <DesktopSidebar />
 * </DesktopOnly>
 * ```
 */
export function DesktopOnly({ children }: { children: React.ReactNode }): React.ReactNode {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isMobile) {
    return null;
  }
  
  return children;
}

export default ConditionalRender;
