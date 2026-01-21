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

  // Autofoco automático no primeiro campo de input/textarea quando aberto
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (contentRef.current) {
        // Procura primeiro por inputs de busca ou principais
        const priorityInput = contentRef.current.querySelector('input[placeholder*="buscar"], input[placeholder*="pesquisar"], input[name*="search"]') as HTMLElement;
        const firstInput = priorityInput || contentRef.current.querySelector('input:not([type="hidden"]), textarea, [contenteditable="true"]') as HTMLElement;
        
        if (firstInput) {
          firstInput.focus();
          if (firstInput instanceof HTMLInputElement || firstInput instanceof HTMLTextAreaElement) {
            const val = firstInput.value;
            firstInput.value = '';
            firstInput.value = val;
          }
        }
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, []); // Executa ao montar (quando o modal abre)

  // Mobile: Render as Drawer
  if (isMobile && !forceDialog) {
    return (
      <DrawerContent
        ref={contentRef}
        className={cn(
          "max-h-[96dvh] overflow-hidden flex flex-col bg-background transition-all duration-300 ease-in-out",
          className
        )}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          // Reposicionamento dinâmico conforme o teclado
          // No iOS/Safari, o visualViewport.height diminui e precisamos subir o modal
          transform: isKeyboardVisible ? `translateY(-${Math.max(0, keyboardHeight - 20)}px)` : 'translateY(0)',
          // Margem de segurança para o teclado
          marginBottom: isKeyboardVisible ? 'env(safe-area-inset-bottom, 20px)' : '0',
          // Suaviza a transição quando o teclado aparece
          transitionProperty: 'transform, margin-bottom, height',
          transitionDuration: '300ms',
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
