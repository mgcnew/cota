import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useRef, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobilePageTransitionProps {
  children: ReactNode;
}

// Ordem das rotas para determinar direção da transição
const routeOrder: Record<string, number> = {
  "/dashboard": 1,
  "/produtos": 2,
  "/fornecedores": 3,
  "/cotacoes": 4,
  "/pedidos": 5,
  "/historico": 6,
  "/relatorios": 7,
  "/analytics": 8,
  "/locucoes": 9,
  "/whatsapp-mensagens": 10,
  "/configuracoes": 11,
};

function getRouteOrder(pathname: string): number {
  // Remove query params e hash
  const cleanPath = pathname.split('?')[0].split('#')[0];
  return routeOrder[cleanPath] || 999; // Rotas desconhecidas vão para o final
}

function normalizePath(pathname: string): string {
  // Remove query params e hash para comparar apenas a rota base
  return pathname.split('?')[0].split('#')[0];
}

export function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const prevLocationRef = useRef(normalizePath(location.pathname));
  const directionRef = useRef<'forward' | 'backward'>('forward');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const currentPath = normalizePath(location.pathname);
    const prevPath = prevLocationRef.current;
    
    // Na primeira renderização, não animar
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationRef.current = currentPath;
      setShouldAnimate(false);
      return;
    }
    
    // Se a rota não mudou (mesma página), não animar
    if (currentPath === prevPath) {
      setShouldAnimate(false);
      return;
    }
    
    // Se a rota mudou, preparar animação
    const prevOrder = getRouteOrder(prevPath);
    const currentOrder = getRouteOrder(currentPath);
    
    // Determina a direção baseado na ordem das rotas
    if (currentOrder > prevOrder) {
      directionRef.current = 'forward';
    } else if (currentOrder < prevOrder) {
      directionRef.current = 'backward';
    } else {
      // Se ordem for igual, mantém forward como padrão
      directionRef.current = 'forward';
    }
    
    // Ativar animação apenas se a rota realmente mudou
    setShouldAnimate(true);
    prevLocationRef.current = currentPath;
  }, [location.pathname]);

  // No desktop, não aplicar transição especial
  if (!isMobile) {
    return <>{children}</>;
  }

  const direction = directionRef.current;

  // Variantes para transição de extensão horizontal (slide como extensão)
  // A página atual sai na direção oposta enquanto a nova entra
  // Se não deve animar, não aplica transformações
  const pageVariants = {
    initial: (dir: 'forward' | 'backward') => ({
      x: shouldAnimate ? (dir === 'forward' ? '100%' : '-100%') : 0,
      opacity: 1,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 'forward' | 'backward') => ({
      x: shouldAnimate ? (dir === 'forward' ? '-100%' : '100%') : 0,
      opacity: 1,
    }),
  };

  const transition = {
    type: "tween" as const,
    ease: [0.25, 0.46, 0.45, 0.94] as const, // Easing suave
    duration: 0.4, // Duração um pouco maior para ser perceptível
  };

  // Ajustar transição para ser instantânea quando não deve animar
  const transitionConfig = shouldAnimate ? transition : {
    duration: 0,
    ease: 'linear' as const,
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden" 
      style={{ 
        minHeight: '100vh',
        position: 'relative',
        isolation: 'isolate', // Cria novo contexto de empilhamento
      }}
    >
      <AnimatePresence 
        initial={false}
        custom={direction}
      >
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitionConfig}
          className={shouldAnimate ? "absolute inset-0 w-full" : "relative w-full"}
          style={{ 
            willChange: shouldAnimate ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            WebkitTransform: shouldAnimate ? 'translateZ(0)' : 'none', // Aceleração por hardware apenas quando animar
            minHeight: '100%',
            zIndex: shouldAnimate ? 1 : 'auto', // Z-index apenas quando animar
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

