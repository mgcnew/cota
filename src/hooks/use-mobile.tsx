import { useState, useEffect, useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

// Cache do valor para evitar recálculos
let cachedIsMobile: boolean | null = null;

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  if (cachedIsMobile === null) {
    cachedIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
  }
  return cachedIsMobile;
}

// Store para useSyncExternalStore - mais eficiente que useState + useEffect
const subscribers = new Set<() => void>();

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return getIsMobile();
}

function getServerSnapshot() {
  return false;
}

// Listener global único para resize
if (typeof window !== 'undefined') {
  let resizeTimeout: number | null = null;
  
  window.addEventListener('resize', () => {
    // Debounce para evitar muitas atualizações
    if (resizeTimeout) {
      cancelAnimationFrame(resizeTimeout);
    }
    resizeTimeout = requestAnimationFrame(() => {
      const newValue = window.innerWidth < MOBILE_BREAKPOINT;
      if (newValue !== cachedIsMobile) {
        cachedIsMobile = newValue;
        subscribers.forEach(callback => callback());
      }
    });
  }, { passive: true });
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
