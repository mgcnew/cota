/**
 * ResponsiveDialog - Wrapper que converte Dialog para Drawer no mobile
 * 
 * Este componente substitui o Dialog padrão e automaticamente:
 * - Renderiza como Drawer (bottom sheet) no mobile
 * - Renderiza como Dialog (modal centralizado) no desktop
 * 
 * Uso: Substitua imports de Dialog por ResponsiveDialog
 */

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardAdjustment } from "@/hooks/useKeyboardAdjustment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const ResponsiveDialog = ({ children, ...props }: React.ComponentProps<typeof Dialog>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <Drawer {...props}>{children}</Drawer>;
  }
  
  return <Dialog {...props}>{children}</Dialog>;
};

const ResponsiveDialogTrigger = ({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerTrigger {...props}>{children}</DrawerTrigger>;
  }
  
  return <DialogTrigger {...props}>{children}</DialogTrigger>;
};

const ResponsiveDialogClose = ({ children, ...props }: React.ComponentProps<typeof DialogClose>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerClose {...props}>{children}</DrawerClose>;
  }
  
  return <DialogClose {...props}>{children}</DialogClose>;
};

const ResponsiveDialogPortal = ({ children, ...props }: React.ComponentProps<typeof DialogPortal>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerPortal {...props}>{children}</DrawerPortal>;
  }
  
  return <DialogPortal {...props}>{children}</DialogPortal>;
};

const ResponsiveDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof DialogOverlay>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerOverlay className={className} {...props} />;
  }
  
  return <DialogOverlay className={className} {...props} />;
};

interface ResponsiveDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  /** Force dialog mode even on mobile */
  forceDialog?: boolean;
}

const ResponsiveDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  ResponsiveDialogContentProps
>(({ className, children, forceDialog = false, ...props }, ref) => {
  const isMobile = useIsMobile();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardAdjustment();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Função para rolar até o elemento focado
  const scrollToFocusedElement = React.useCallback(() => {
    if (!isMobile || !isKeyboardVisible) return;
    
    // Pequeno delay para garantir que o layout foi atualizado
    requestAnimationFrame(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && contentRef.current?.contains(activeElement)) {
        // Verifica se é um input/textarea
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
          // Aguarda a transição do teclado
          setTimeout(() => {
            activeElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }, 300); // Sincronizado com a transição do drawer
        }
      }
    });
  }, [isMobile, isKeyboardVisible]);

  // Listener para foco em elementos
  React.useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      if (isMobile && isKeyboardVisible) {
        scrollToFocusedElement();
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('focusin', handleFocus);
    }

    return () => {
      if (element) {
        element.removeEventListener('focusin', handleFocus);
      }
    };
  }, [isMobile, isKeyboardVisible, scrollToFocusedElement]);

  // Reagir à abertura do teclado
  React.useEffect(() => {
    if (isKeyboardVisible) {
      scrollToFocusedElement();
    }
  }, [isKeyboardVisible, scrollToFocusedElement]);

  // Autofoco automático no primeiro campo de input/textarea quando aberto
  React.useEffect(() => {
    let focusTimer: number;
    
    // Pequeno atraso para garantir que a animação de entrada terminou
    focusTimer = window.setTimeout(() => {
      if (contentRef.current) {
        // Procura primeiro por inputs de busca ou principais
        const priorityInput = contentRef.current.querySelector('input[placeholder*="buscar"], input[placeholder*="pesquisar"], input[name*="search"]') as HTMLElement;
        const firstInput = priorityInput || contentRef.current.querySelector('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [contenteditable="true"]') as HTMLElement;
        
        if (firstInput && document.activeElement !== firstInput) {
          try {
            firstInput.focus();
            if (firstInput instanceof HTMLInputElement || firstInput instanceof HTMLTextAreaElement) {
              const val = firstInput.value;
              firstInput.value = '';
              firstInput.value = val;
            }
          } catch (e) {
            console.warn("Erro ao focar input:", e);
          }
        }
      }
    }, 400); 

    return () => {
      if (focusTimer) window.clearTimeout(focusTimer);
    };
  }, []); // Executa apenas ao montar (quando o modal abre)

  // Mobile: Render as Drawer
  if (isMobile && !forceDialog) {
    return (
      <DrawerContent
        ref={contentRef}
        className={cn(
          "max-h-[96dvh] overflow-hidden flex flex-col bg-background",
          className
        )}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          // REMOVIDO: transform manual que causava conflito com o redimensionamento nativo do Android
          // O Drawer da biblioteca 'vaul' já gerencia o posicionamento fixed/bottom
          
          // Ajusta a altura máxima para garantir que cabe na tela visível
          maxHeight: isKeyboardVisible ? '100dvh' : '96dvh',
          
          // Importante: Padding inferior dinâmico para garantir que o conteúdo role acima do teclado
          // No iOS, o teclado sobrepõe, então precisamos de padding grande.
          // No Android, a viewport encolhe, então o padding pode ser menor, mas mal não faz.
          paddingBottom: isKeyboardVisible ? `${keyboardHeight + 20}px` : 'env(safe-area-inset-bottom, 20px)',
          
          transition: 'padding-bottom 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), max-height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          willChange: 'padding-bottom, max-height',
        }}
        {...props as any}
      >
        {children}
      </DrawerContent>
    );
  }

  // Desktop: Render as Dialog
  return (
    <DialogContent ref={ref} className={className} {...props}>
      <div ref={contentRef} className="h-full flex flex-col">
        {children}
      </div>
    </DialogContent>
  );
});
ResponsiveDialogContent.displayName = "ResponsiveDialogContent";

const ResponsiveDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerHeader className={cn("text-left flex-shrink-0", className)} {...props} />;
  }
  
  return <DialogHeader className={className} {...props} />;
};
ResponsiveDialogHeader.displayName = "ResponsiveDialogHeader";

const ResponsiveDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerFooter className={cn("pt-2 flex-shrink-0 border-t border-border", className)} {...props} />;
  }
  
  return <DialogFooter className={className} {...props} />;
};
ResponsiveDialogFooter.displayName = "ResponsiveDialogFooter";

const ResponsiveDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerTitle ref={ref} className={className} {...props} />;
  }
  
  return <DialogTitle ref={ref} className={className} {...props} />;
});
ResponsiveDialogTitle.displayName = "ResponsiveDialogTitle";

const ResponsiveDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <DrawerDescription ref={ref} className={className} {...props} />;
  }
  
  return <DialogDescription ref={ref} className={className} {...props} />;
});
ResponsiveDialogDescription.displayName = "ResponsiveDialogDescription";

export {
  ResponsiveDialog,
  ResponsiveDialogPortal,
  ResponsiveDialogOverlay,
  ResponsiveDialogClose,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
