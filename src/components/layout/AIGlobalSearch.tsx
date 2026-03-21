import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles, Loader2, Send, MessageSquareText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";
import { askGemini } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { designSystem } from "@/styles/design-system";

interface AIGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mini-parse para o **negrito** nativo do Markdown que o Gemini manda
function FormattedMessage({ content }: { content: string }) {
  // Transforma **texto** em <strong>texto</strong> e faz quebras seguras
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <div className={cn("text-[15px] leading-[1.65] text-foreground font-medium", "tracking-tight")}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return <span key={i} className="whitespace-pre-wrap opacity-90">{part}</span>;
      })}
    </div>
  );
}

// Conteúdo do chat - memoizado para evitar re-renders
const ChatContent = memo(function ChatContent({
  conversationHistory,
  isLoading,
  searchQuery,
  setSearchQuery,
  onAskAI,
  scrollAreaRef,
}: {
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAskAI: () => void;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático e bloqueio de enters
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAskAI();
    }
  }, [onAskAI]);

  const exampleQuestions = [
    "Quanto gastei em novembro de 2025?",
    "Quanto já gastei com a Holambra?",
    "Qual o valor médio pago no arroz?",
    "Qual o menor preço do feijão?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto w-full px-4">
        <div className="w-full py-4">
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[260px] text-center my-auto animate-in fade-in zoom-in-95 duration-300">
              <div className="p-3 rounded-2xl bg-muted border border-border/50 mb-4 shadow-sm">
                <Sparkles strokeWidth={1.5} className="h-6 w-6 text-foreground/80" />
              </div>
              <h3 className={cn(designSystem.typography.size.lg, "font-semibold text-foreground mb-1 tracking-tight")}>
                Assistente de Inteligência Artificial
              </h3>
              <p className="text-sm font-medium text-muted-foreground mb-6 max-w-xs mx-auto">
                Explore seus dados financeiros ou orçamentos usando comandos naturais.
              </p>
              
              <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
                {exampleQuestions.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(example)}
                    className="text-left py-2 px-3 rounded-xl border border-border/40 bg-card hover:bg-muted transition-colors text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                    <span className="truncate">{example}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-2">
              {conversationHistory.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-lg border border-border/50 bg-muted flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-foreground/70" />
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={cn(
                      "max-w-[85%]", 
                      msg.role === "user" 
                        ? "bg-foreground text-background rounded-2xl rounded-tr-sm px-3.5 py-2 shadow-sm" 
                        : "pt-1"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-medium">
                        <FormattedMessage content={msg.content} />
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-7 h-7 rounded-lg border border-border/50 bg-muted flex items-center justify-center">
                      <Loader2 className="h-3.5 w-3.5 text-foreground/70 animate-spin" />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area (Strictly Standard & Flat) */}
      <div className="border-t border-border/60 bg-card p-3 flex-shrink-0">
        <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
          <Input
            ref={inputRef}
            placeholder="Faça sua pergunta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 h-10 border-border/50 bg-background shadow-sm text-sm"
          />
          <Button
            onClick={onAskAI}
            disabled={!searchQuery.trim() || isLoading}
            size="icon"
            variant="default"
            className="h-10 w-10 flex-shrink-0 shadow-sm transition-colors rounded-lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

export function AIGlobalSearch({ open, onOpenChange }: AIGlobalSearchProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Dados só são carregados quando o modal está aberto
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { cotacoes } = useCotacoes();
  const { pedidos } = usePedidos();

  // Buscar dados financeiros apenas quando aberto (sem limites para dar contexto completo à IA)
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: quoteSupplierItems = [] } = useQuery({
    queryKey: ["quote-supplier-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quote_supplier_items")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagingQuotes = [] } = useQuery({
    queryKey: ["packaging-quotes-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_quotes")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagingOrders = [] } = useQuery({
    queryKey: ["packaging-orders-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_orders")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagingOrderItems = [] } = useQuery({
    queryKey: ["packaging-order-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_order_items")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: packagingSupplierItems = [] } = useQuery({
    queryKey: ["packaging-supplier-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_supplier_items")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (conversationHistory.length > 0 && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  }, [conversationHistory]);

  // Atalho de teclado - apenas desktop
  useEffect(() => {
    if (isMobile) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down, { passive: true });
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, isMobile]);

  // Limpar ao fechar
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setConversationHistory([]);
    }
  }, [open]);

  const handleAskAI = useCallback(async () => {
    if (!searchQuery.trim() || isLoading) return;

    const userQuery = searchQuery.trim();
    setIsLoading(true);
    setConversationHistory(prev => [...prev, { role: "user", content: userQuery }]);
    setSearchQuery("");

    try {
      const response = await askGemini(userQuery, {
        products: products || [],
        suppliers: suppliers || [],
        quotes: cotacoes || [],
        orders: pedidos || [],
        orderItems: orderItems || [],
        quoteSupplierItems: quoteSupplierItems || [],
        packagingQuotes: packagingQuotes || [],
        packagingOrders: packagingOrders || [],
        packagingOrderItems: packagingOrderItems || [],
        packagingSupplierItems: packagingSupplierItems || [],
      });

      setConversationHistory(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      toast({
        title: "Erro ao processar pergunta",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isLoading, products, suppliers, cotacoes, pedidos, orderItems, quoteSupplierItems, packagingQuotes, packagingOrders, packagingOrderItems, packagingSupplierItems, toast]);

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand/10">
                <MessageSquareText className="h-4 w-4 text-brand" />
              </div>
              <div>
                <DrawerTitle className="text-sm font-semibold">Assistente Inteligente</DrawerTitle>
                <p className="text-xs text-muted-foreground">Analista financeiro e comprador profissional</p>
              </div>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <ChatContent
              conversationHistory={conversationHistory}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAskAI={handleAskAI}
              scrollAreaRef={scrollAreaRef}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Proper Dialog Layout for Chat
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden flex flex-col h-[75vh] max-h-[700px] border-border/60 shadow-xl bg-background sm:rounded-2xl">
        <DialogTitle className="sr-only">Assistente Inteligente</DialogTitle>
        
        {/* Header Premium Flat */}
        <div className="border-b border-border/50 shrink-0 bg-card">
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="p-2 rounded-xl bg-muted shrink-0 border border-border/50">
              <Sparkles className="h-4 w-4 text-foreground/80" />
            </div>
            <div className="flex-1 leading-tight">
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Cota Aki AI
              </h3>
              <p className="text-[11px] text-muted-foreground font-medium">Assistente de Banco de Dados</p>
            </div>
            <kbd className="hidden sm:inline-flex h-6 px-2 select-none items-center justify-center rounded-md border border-border/80 bg-background font-mono text-[10px] font-bold text-muted-foreground shadow-sm">
              ESC
            </kbd>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">          
          <div className="w-full flex-1 relative z-10 flex flex-col h-full">
            <ChatContent
              conversationHistory={conversationHistory}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAskAI={handleAskAI}
              scrollAreaRef={scrollAreaRef}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AIGlobalSearchTrigger({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "relative transition-all duration-300 active:scale-95 touch-manipulation group",
        compact ? "h-9 px-3 w-auto min-w-[180px]" : "w-full h-10 px-4 justify-start",
        "bg-white/5 dark:bg-white/5 backdrop-blur-md overflow-hidden",
        "border border-brand/20 hover:border-brand/50",
        "shadow-[0_2px_10px_-3px_hsl(var(--primary)/0.05)] hover:shadow-[0_4px_20px_-5px_hsl(var(--primary)/0.15)]"
      )}
    >
      <div className="flex items-center w-full gap-2 relative z-10">
        <div className="relative">
          <Sparkles className="h-4 w-4 shrink-0 text-brand group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 blur-sm bg-brand/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-muted-foreground font-medium flex-1 text-left text-sm truncate group-hover:text-foreground transition-colors">
          Assistente de IA
        </span>
        {!compact && (
          <div className="hidden lg:flex items-center gap-1">
            <kbd className="h-5 px-1.5 flex items-center justify-center rounded border border-brand/20 bg-brand/5 font-mono text-[10px] font-medium text-brand">
              ⌘
            </kbd>
            <kbd className="h-5 px-1.5 flex items-center justify-center rounded border border-brand/20 bg-brand/5 font-mono text-[10px] font-medium text-brand">
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
    </Button>
  );
}
