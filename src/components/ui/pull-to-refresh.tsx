import { ReactNode, useRef, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  threshold?: number; // Distância em pixels para ativar refresh
}

/**
 * Componente Pull-to-Refresh otimizado para mobile
 * 
 * Funciona apenas em dispositivos touch (mobile)
 * No desktop, apenas renderiza o children normalmente
 */
export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isMobile = useIsMobile();

  // Se não for mobile, apenas renderiza children
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Só ativa se estiver no topo da página
    const isAtTop = container.scrollTop === 0;
    if (!isAtTop) return;

    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || !isPulling) return;

    const container = containerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    // Só permite puxar para baixo
    if (distance > 0 && container.scrollTop === 0) {
      e.preventDefault(); // Previne scroll da página
      const limitedDistance = Math.min(distance, threshold * 1.5);
      setPullDistance(limitedDistance);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);

    // Se puxou o suficiente, ativa refresh
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animação de volta
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    container.addEventListener("touchstart", handleTouchStart as any, { passive: false });
    container.addEventListener("touchmove", handleTouchMove as any, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart as any);
      container.removeEventListener("touchmove", handleTouchMove as any);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, disabled, isRefreshing, isPulling, pullDistance, threshold]);

  const pullPercentage = Math.min((pullDistance / threshold) * 100, 100);
  const shouldShowIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{
        transform: shouldShowIndicator ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined,
        transition: isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Indicador de Pull-to-Refresh */}
      {shouldShowIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 z-50"
          style={{
            transform: `translateY(-100%)`,
            opacity: Math.min(pullPercentage / 100, 1),
          }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Atualizando...</span>
              </>
            ) : (
              <>
                <Loader2
                  className="h-4 w-4 transition-transform"
                  style={{
                    transform: `rotate(${pullPercentage * 3.6}deg)`,
                  }}
                />
                <span>
                  {pullPercentage >= 100 ? "Solte para atualizar" : "Puxe para atualizar"}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

