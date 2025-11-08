import { memo, useRef, useState, useMemo, useCallback } from 'react';
import { CotacoesCardMemoized } from './CotacoesCardMemoized';
import type { Quote } from '@/hooks/useCotacoes';

interface CotacoesVirtualListProps {
  cotacoes: Quote[];
  onView: (cotacao: Quote) => void;
  onEdit: (cotacao: Quote) => void;
  onDelete: (cotacao: Quote) => void;
  getStatusBadge: (status: string) => JSX.Element;
  isMobile: boolean;
}

const ITEM_HEIGHT = 200; // Altura aproximada de cada card
const OVERSCAN = 2; // Quantos itens renderizar além do visível

/**
 * Lista virtualizada de cotações
 * - Renderiza apenas itens visíveis + overscan
 * - Scroll otimizado com requestAnimationFrame
 * - Performance para listas grandes
 */
export const CotacoesVirtualList = memo<CotacoesVirtualListProps>(
  function CotacoesVirtualList({
    cotacoes,
    onView,
    onEdit,
    onDelete,
    getStatusBadge,
    isMobile,
  }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const rafRef = useRef<number | null>(null);

    // Calcular altura do container (viewport)
    const containerHeight = isMobile ? 
      (typeof window !== 'undefined' ? window.innerHeight - 300 : 600) : 
      800;

    // Calcular range visível
    const visibleRange = useMemo(() => {
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
      const end = Math.min(
        cotacoes.length - 1,
        Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
      );
      return { start, end };
    }, [scrollTop, containerHeight, cotacoes.length]);

    // Handler de scroll otimizado
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(e.currentTarget.scrollTop);
      });
    }, []);

    // Itens visíveis
    const visibleItems = useMemo(() => {
      const items = [];
      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        if (cotacoes[i]) {
          items.push(
            <div
              key={cotacoes[i].id}
              style={{
                position: 'absolute',
                top: i * ITEM_HEIGHT,
                left: 0,
                right: 0,
                height: ITEM_HEIGHT,
                padding: '0 0 12px 0',
              }}
            >
              <CotacoesCardMemoized
                cotacao={cotacoes[i]}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                getStatusBadge={getStatusBadge}
              />
            </div>
          );
        }
      }
      return items;
    }, [cotacoes, visibleRange, onView, onEdit, onDelete, getStatusBadge]);

    if (cotacoes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhuma cotação encontrada</p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: containerHeight,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
        className="relative"
      >
        <div
          style={{
            position: 'relative',
            height: cotacoes.length * ITEM_HEIGHT,
            width: '100%',
          }}
        >
          {visibleItems}
        </div>
      </div>
    );
  }
);
