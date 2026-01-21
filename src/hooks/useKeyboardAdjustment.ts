import { useState, useEffect } from 'react';

export function useKeyboardAdjustment() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualViewportChange = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const currentKeyboardHeight = window.innerHeight - viewport.height;
      
      // Consider keyboard visible if height difference is significant (> 100px)
      // and it's likely a mobile device (touch support)
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const visible = currentKeyboardHeight > 100 && hasTouch;
      
      setKeyboardHeight(visible ? currentKeyboardHeight : 0);
      setIsKeyboardVisible(visible);
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
