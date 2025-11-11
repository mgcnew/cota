import { memo, useEffect, useRef, useCallback } from 'react';
import { OrderMobileCard } from './OrderMobileCard';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * PADRÃO OTIMIZADO DE COTAÇÕES APLICADO
 * - Mesma estrutura de infinite scroll
 * - Mesmas otimizações de performance
 * - Mesmos estados de loading
 * - Memoizado para evitar re-renders
 */

interface OrderListItem {
  id: string;
  supplier_name: string;
  status: string;
  items_count?: number;
  total_value: number;
  delivery_date: string;
  observations?: string;
}

interface Props {
  orders: OrderListItem[];
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onSelect?: (order: OrderListItem) => void;
}

interface OrdersMobileListProps {
  orders: OrderListItem[];
  isLoading?: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onSelect?: (order: OrderListItem) => void;
}

/**
 * Lista de pedidos mobile com infinite scroll estilo Cotações
 * - IntersectionObserver com requestAnimationFrame
 * - Sentinel com rootMargin 200px
 * - CSS containment para isolamento
 * - GPU acceleration
 * - React.memo para performance
 */
export const OrdersMobileList = memo<OrdersMobileListProps>(
  function OrdersMobileList({ orders, isLoading = false, isFetchingNextPage, hasNextPage, fetchNextPage, onSelect }) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Configurar IntersectionObserver - PADRÃO COTAÇÕES
    useEffect(() => {
      if (!sentinelRef.current) return;

      // Disconnect observer anterior
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Criar observer com otimizações
      observerRef.current = new IntersectionObserver(
        (entries) => {
          requestAnimationFrame(() => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
              fetchNextPage();
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '200px',
        }
      );

      observerRef.current.observe(sentinelRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

    // Handlers memoizados
    const handleSelect = useCallback((order: OrderListItem) => {
      onSelect?.(order);
    }, [onSelect]);

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

    // Loading inicial - PADRÃO COTAÇÕES
    if (isLoading && orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando pedidos...</p>
        </div>
      );
    }

    // Lista vazia - PADRÃO COTAÇÕES
    if (!isLoading && orders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum pedido encontrado</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tente ajustar os filtros</p>
        </div>
      );
    }

    return (
      <div 
        className="space-y-3 pb-4"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        {/* Lista de pedidos - PADRÃO COTAÇÕES */}
        {orders.map(o => (
          <OrderMobileCard
            key={o.id}
            id={o.id}
            supplier={o.supplier_name}
            status={o.status}
            items={o.items_count || 0}
            total={formatCurrency(o.total_value)}
            deliveryDate={formatDate(o.delivery_date)}
            onClick={() => handleSelect(o)}
          />
        ))}

        {/* Sentinel para infinite scroll - PADRÃO COTAÇÕES */}
        <div
          ref={sentinelRef}
          className={cn(
            "flex items-center justify-center py-4",
            !hasNextPage && "hidden"
          )}
          aria-hidden="true"
          style={{
            contain: 'layout style paint',
          }}
        >
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando mais pedidos...</span>
            </div>
          )}
        </div>

        {/* Mensagem de fim da lista - PADRÃO COTAÇÕES */}
        {!hasNextPage && orders.length > 0 && (
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
