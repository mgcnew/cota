import { useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useMobile } from "@/contexts/MobileProvider";

interface MobilePageTransitionProps {
  children: ReactNode;
}

export function MobilePageTransition({ children }: MobilePageTransitionProps) {
  const location = useLocation();
  const isMobile = useMobile();

  // No desktop, não aplicar transição especial
  if (!isMobile) {
    return <>{children}</>;
  }

  // No mobile, retornar children diretamente sem animação para melhor performance
  // A transição de página é instantânea para evitar lags
  return (
    <div 
      className="relative w-full h-full"
      style={{ 
        minHeight: '100vh',
        position: 'relative',
      }}
      key={location.pathname}
    >
      {children}
    </div>
  );
}

