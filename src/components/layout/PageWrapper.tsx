import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  // Sempre usar div simples - SmoothPageTransition já cuida das animações de página
  // Não precisamos animar PageWrapper para evitar conflitos e duplicações
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
}

export function PageSection({ children, className = "" }: PageWrapperProps) {
  // Sempre usar div simples - evita conflitos com animações de página
  return (
    <div className={className}>
      {children}
    </div>
  );
}