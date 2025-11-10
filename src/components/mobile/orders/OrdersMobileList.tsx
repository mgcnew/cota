import { useEffect, useRef } from 'react';
import { OrderMobileCard } from './OrderMobileCard';

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

export function OrdersMobileList({ orders, isFetchingNextPage, hasNextPage, fetchNextPage, onSelect }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) fetchNextPage();
    }, { rootMargin: '200px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  return (
    <div className="grid gap-3 grid-cols-1">
      {orders.map(o => (
        <OrderMobileCard
          key={o.id}
          id={o.id}
          supplier={o.supplier_name}
          status={o.status}
          items={o.items_count || 0}
          total={formatCurrency(o.total_value)}
          deliveryDate={formatDate(o.delivery_date)}
          onClick={() => onSelect?.(o)}
        />
      ))}
      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <div className="py-6 text-center text-muted-foreground text-sm">Carregando mais...</div>
      )}
      {!hasNextPage && orders.length > 0 && (
        <div className="py-4 text-center text-muted-foreground text-xs">Fim da lista</div>
      )}
    </div>
  );
}
