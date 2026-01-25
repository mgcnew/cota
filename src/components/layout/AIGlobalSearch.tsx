import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sparkles, Loader2, Send, MessageSquareText } from "lucide-react";
import { CommandDialog, CommandInput } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";
import { queryGroqAssistant } from "@/lib/groq";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AIGlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        <div className="p-4">
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[250px] py-6 text-center">
              <div className="p-3 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20 mb-4">
                <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Como posso ajudar?</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Pergunte sobre produtos, fornecedores, preços...
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {exampleQuestions.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(example)}
                    className="text-left p-2.5 rounded-lg border border-border active:bg-accent transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {conversationHistory.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 h-fit flex-shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                  )}
                  <div className={cn("rounded-lg p-2.5 max-w-[85%]", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 h-fit">
                    <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="rounded-lg p-2.5 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Faça uma pergunta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 h-10"
          />
          <Button
            onClick={onAskAI}
            disabled={!searchQuery.trim() || isLoading}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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

  // Buscar dados financeiros apenas quando aberto
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      return data || [];
    },
    enabled: open, // Só busca quando aberto
  });

  const { data: quoteSupplierItems = [] } = useQuery({
    queryKey: ["quote-supplier-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quote_supplier_items")
        .select("*, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);
      return data || [];
    },
    enabled: open,
  });

  const { data: packagingQuotes = [] } = useQuery({
    queryKey: ["packaging-quotes-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: open,
  });

  const { data: packagingOrders = [] } = useQuery({
    queryKey: ["packaging-orders-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: open,
  });

  const { data: packagingOrderItems = [] } = useQuery({
    queryKey: ["packaging-order-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_order_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: open,
  });

  const { data: packagingSupplierItems = [] } = useQuery({
    queryKey: ["packaging-supplier-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packaging_supplier_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: open,
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
      const response = await queryGroqAssistant(userQuery, {
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <MessageSquareText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <DrawerTitle className="text-sm font-semibold">Assistente IA</DrawerTitle>
                <p className="text-xs text-muted-foreground">Pergunte sobre cotações</p>
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

  // Desktop: CommandDialog
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative flex flex-col h-[80vh] max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="relative flex items-center px-4 py-3.5 gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20 shrink-0">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Assistente de Cotações</h3>
              <p className="text-xs text-muted-foreground">Pergunte sobre produtos, fornecedores, preços...</p>
            </div>
            <kbd className="inline-flex h-6 px-2 select-none items-center justify-center rounded border border-input bg-muted font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
              ESC
            </kbd>
          </div>
        </div>

        <ChatContent
          conversationHistory={conversationHistory}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAskAI={handleAskAI}
          scrollAreaRef={scrollAreaRef}
        />
      </div>
    </CommandDialog>
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
        "border border-[#83E509]/20 hover:border-[#83E509]/50",
        "shadow-[0_2px_10px_-3px_rgba(131,229,9,0.05)] hover:shadow-[0_4px_20px_-5px_rgba(131,229,9,0.15)]"
      )}
    >
      <div className="flex items-center w-full gap-2 relative z-10">
        <div className="relative">
          <Sparkles className="h-4 w-4 shrink-0 text-[#83E509] group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute inset-0 blur-sm bg-[#83E509]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-muted-foreground font-medium flex-1 text-left text-sm truncate group-hover:text-foreground transition-colors">
          Assistente de IA
        </span>
        {!compact && (
          <div className="hidden lg:flex items-center gap-1">
            <kbd className="h-5 px-1.5 flex items-center justify-center rounded border border-[#83E509]/20 bg-[#83E509]/5 font-mono text-[10px] font-medium text-[#83E509]">
              ⌘
            </kbd>
            <kbd className="h-5 px-1.5 flex items-center justify-center rounded border border-[#83E509]/20 bg-[#83E509]/5 font-mono text-[10px] font-medium text-[#83E509]">
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" />
    </Button>
  );
}
