import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  width: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook para detectar tipo de dispositivo
 * 
 * Retorna informações sobre o dispositivo atual:
 * - isMobile: true se largura < 768px
 * - isTablet: true se largura >= 768px e < 1024px
 * - isDesktop: true se largura >= 1024px
 * - deviceType: 'mobile' | 'tablet' | 'desktop'
 * - width: largura atual da viewport
 * 
 * Atualiza automaticamente quando a janela é redimensionada
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        width: 1920,
      };
    }

    const width = window.innerWidth;
    const isMobile = width < MOBILE_BREAKPOINT;
    const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    const isDesktop = width >= TABLET_BREAKPOINT;

    return {
      isMobile,
      isTablet,
      isDesktop,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        width,
      });
    };

    // Usar matchMedia para otimizar performance
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    );

    const handleChange = () => updateDeviceInfo();

    // addEventListener para matchMedia
    mobileQuery.addEventListener('change', handleChange);
    tabletQuery.addEventListener('change', handleChange);

    // Atualizar imediatamente
    updateDeviceInfo();

    return () => {
      mobileQuery.removeEventListener('change', handleChange);
      tabletQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return deviceInfo;
}
