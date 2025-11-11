import { useCallback, useRef, useEffect, useState } from 'react';
import { OrderMobileCard } from './OrderMobileCard';

interface OrderListItem {
  id: string;
  supplier_name: string;
  status: string;
  items_count?: number;
  total_value: number;
  total_value_formatted?: string;
  delivery_date: string;
  delivery_date_formatted?: string;
  observations?: string;
}

interface Props {
  orders: OrderListItem[];
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onSelect?: (order: OrderListItem) => void;
}

const ITEM_HEIGHT = 140;
const BUFFER_SIZE = 3; // Reduzir buffer para melhor performance
const LOAD_MORE_THRESHOLD = 5;
const SCROLL_THROTTLE = 16; // ~60fps

export function OrdersMobileListOptimized({ 
  orders, 
  isFetchingNextPage, 
  hasNextPage, 
  fetchNextPage, 
  onSelect 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const loadingRef = useRef(false);

  // Calcular quais itens estão visíveis
  const updateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const end = Math.min(
      orders.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    setVisibleRange({ start, end });

    // Carregar mais quando chegar perto do fim
    if (end >= orders.length - LOAD_MORE_THRESHOLD && hasNextPage && !isFetchingNextPage && !loadingRef.current) {
      loadingRef.current = true;
      fetchNextPage();
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [orders.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Optimized scroll handler com throttle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      
      // Throttle para evitar excesso de cálculos
      if (now - lastScrollTime < SCROLL_THROTTLE) {
        return;
      }
      
      lastScrollTime = now;
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        updateVisibleRange();
        rafId = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    updateVisibleRange(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [updateVisibleRange]);

  const totalHeight = orders.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;
  const visibleOrders = orders.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{
        height: 'calc(100vh - 200px)',
        WebkitOverflowScrolling: 'touch',
        // Aceleração de hardware sem willChange
        transform: 'translateZ(0)',
        // Otimizações de rendering
        contain: 'layout style paint',
        // Scroll suave nativo
        scrollBehavior: 'auto',
      }}
    >
      <div style={{ 
        height: totalHeight, 
        position: 'relative',
        contain: 'layout style paint',
      }}>
        <div
          style={{
            // Usar translate3d para aceleração de hardware
            transform: `translate3d(0, ${offsetY}px, 0)`,
            // Remover willChange que pode causar lentidão
            backfaceVisibility: 'hidden',
            perspective: 1000,
          }}
        >
          {visibleOrders.map((order, index) => (
            <div
              key={order.id}
              className="px-3 py-2"
              style={{ 
                height: ITEM_HEIGHT,
                contain: 'layout style paint',
              }}
            >
              <OrderMobileCard
                id={order.id}
                supplier={order.supplier_name}
                status={order.status}
                items={order.items_count || 0}
                total={
                  order.total_value_formatted ||
                  order.total_value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                }
                deliveryDate={
                  order.delivery_date_formatted ||
                  new Date(order.delivery_date).toLocaleDateString('pt-BR')
                }
                onClick={() => onSelect?.(order)}
              />
            </div>
          ))}
        </div>
      </div>

      {isFetchingNextPage && (
        <div className="py-6 text-center text-muted-foreground text-sm">
          Carregando mais...
        </div>
      )}

      {!hasNextPage && orders.length > 0 && (
        <div className="py-4 text-center text-muted-foreground text-xs">
          Fim da lista
        </div>
      )}
    </div>
  );
}
