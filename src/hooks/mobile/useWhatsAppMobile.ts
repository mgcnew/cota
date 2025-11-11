import { useMemo } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para otimizar WhatsApp em mobile
 * - Limitar imagens simultâneas
 * - Comprimir previews
 * - Simplificar animações
 */
export function useWhatsAppMobile() {
  const isMobile = useMobile();

  const config = useMemo(() => ({
    // Limitar imagens em mobile (memória)
    maxImages: isMobile ? 3 : 10,
    
    // Comprimir previews em mobile
    previewQuality: isMobile ? 0.6 : 0.9,
    previewMaxWidth: isMobile ? 400 : 800,
    
    // Desabilitar animações complexas
    enableAnimations: !isMobile,
    
    // Limitar contatos carregados
    maxContactsLoaded: isMobile ? 50 : 200,
    
    // Lazy load de mensagens
    messagesPerPage: isMobile ? 20 : 50,
    
    // Debounce de input
    inputDebounce: isMobile ? 300 : 150,
  }), [isMobile]);

  return config;
}
