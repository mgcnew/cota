import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

export function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();

  // Transição completamente instantânea sem nenhuma animação
  // Apenas muda o conteúdo sem efeitos visuais que possam causar piscar
  return (
    <div className="w-full" key={location.pathname}>
      {children}
    </div>
  );
}