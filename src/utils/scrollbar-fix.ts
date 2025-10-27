/**
 * Scrollbar Layout Shift Fix
 * Prevents layout shift when dropdowns/modals open and hide the scrollbar
 */

export function initScrollbarFix() {
  // Calculate scrollbar width
  const getScrollbarWidth = () => {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.width = '100px';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    inner.style.width = '100%';
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.remove();

    return scrollbarWidth;
  };

  // Set CSS variable with scrollbar width
  const scrollbarWidth = getScrollbarWidth();
  document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);

  // Observer to watch for scroll-lock changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style' || mutation.attributeName === 'data-scroll-locked') {
        const body = document.body;
        const html = document.documentElement;
        
        // Check if body scroll is locked (by Radix UI or other libraries)
        const isLocked = 
          body.style.overflow === 'hidden' || 
          body.style.overflowY === 'hidden' ||
          html.style.overflow === 'hidden' ||
          body.hasAttribute('data-scroll-locked');

        if (isLocked) {
          body.style.paddingRight = `${scrollbarWidth}px`;
        } else if (!body.style.paddingRight || body.style.paddingRight === '0px') {
          body.style.paddingRight = '';
        }
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'data-scroll-locked', 'class']
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  return () => observer.disconnect();
}
