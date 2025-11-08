import { memo, useEffect, useRef, useCallback } from 'react';
import { CotacaoMobileCard } from './CotacaoMobileCard';
import type { CotacaoMobile } from '@/hooks/mobile/useCotacoesMobile';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CotacoesMobileListProps {
  cotacoes: CotacaoMobile[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onView: (cotacao: CotacaoMobile) => void;
  onEdit: (cotacao: CotacaoMobile) => void;
  onDelete: (cotacao: CotacaoMobile) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

/**
 * Lista de cotações mobile com infinite scroll
 * - Usa IntersectionObserver para carregar próxima página automaticamente
 * - Scroll suave estilo Facebook
 * - Performance otimizada com memo e lazy loading
 * - Estados de loading bem definidos
 */
export const CotacoesMobileList = memo<CotacoesMobileListProps>(
  function CotacoesMobileList({
    cotacoes,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    onView,
    onEdit,
    onDelete,
    getStatusBadge,
  }) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Configurar IntersectionObserver para detectar quando chegar ao fim
    useEffect(() => {
      if (!sentinelRef.current) return;

      // Disconnect observer anterior se existir
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Criar novo observer com otimizações de performance
      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Usar requestAnimationFrame para melhorar performance
          requestAnimationFrame(() => {
            const [entry] = entries;
            // Carregar próxima página quando sentinel entra no viewport
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
              fetchNextPage();
            }
          });
        },
        {
          // Threshold de 0.1 = carregar quando 10% do elemento estiver visível
          threshold: 0.1,
          // Root margin para começar a carregar um pouco antes (otimizado para mobile)
          rootMargin: '200px',
        }
      );

      // Observar o elemento sentinel
      observerRef.current.observe(sentinelRef.current);

      // Cleanup
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

    // Loading inicial
    if (isLoading && cotacoes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando cotações...</p>
        </div>
      );
    }

    // Lista vazia
    if (!isLoading && cotacoes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhuma cotação encontrada</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tente ajustar os filtros</p>
        </div>
      );
    }

    return (
      <div 
        className="space-y-3"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        {/* Lista de cotações */}
        {cotacoes.map((cotacao) => (
          <CotacaoMobileCard
            key={cotacao.id}
            cotacao={cotacao}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            getStatusBadge={getStatusBadge}
          />
        ))}

        {/* Sentinel para infinite scroll */}
        <div
          ref={sentinelRef}
          className={cn(
            "flex items-center justify-center py-4",
            !hasNextPage && "hidden"
          )}
          aria-hidden="true"
        >
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando mais cotações...</span>
            </div>
          )}
        </div>

        {/* Mensagem de fim da lista */}
        {!hasNextPage && cotacoes.length > 0 && (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Você chegou ao fim da lista
            </p>
          </div>
        )}
      </div>
    );
  }
);

