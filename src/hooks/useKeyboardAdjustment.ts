import { useState, useEffect } from 'react';

export function useKeyboardAdjustment() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Usar a altura do window.innerHeight (altura total da janela) 
      // menos a altura do viewport (área visível real)
      const currentKeyboardHeight = window.innerHeight - viewport.height;
      
      // Consider keyboard visible if height difference is significant (> 150px)
      // to avoid triggering on address bar show/hide
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const visible = currentKeyboardHeight > 150 && hasTouch;
      
      const newHeight = visible ? currentKeyboardHeight : 0;
      
      // Só atualiza se a mudança for significativa (> 10px) ou se a visibilidade mudar
      // Isso evita re-renders excessivos por pequenas flutuações
      setKeyboardHeight(prev => {
        if (Math.abs(prev - newHeight) > 10) return newHeight;
        return prev;
      });
      
      setIsKeyboardVisible(prev => {
        if (prev !== visible) return visible;
        return prev;
      });
    };

    window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    window.visualViewport.addEventListener('scroll', handleVisualViewportChange);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleVisualViewportChange);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}
