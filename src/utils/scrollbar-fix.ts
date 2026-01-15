/**
 * Scrollbar Layout Shift Fix - Simplified Version
 * 
 * Versão simplificada que não usa MutationObserver para evitar
 * problemas de performance no mobile.
 */

export function initScrollbarFix() {
  // No mobile, não precisamos de fix de scrollbar
  if (typeof window === 'undefined') return () => {};
  
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    // No mobile, apenas garantir que não há padding-right indesejado
    document.body.style.paddingRight = '';
    return () => {};
  }

  // Calculate scrollbar width apenas no desktop
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

  return () => {};
}
