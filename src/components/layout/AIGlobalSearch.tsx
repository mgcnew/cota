import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, X, Loader2, Send } from "lucide-react";
import { CommandDialog, CommandInput } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

export function AIGlobalSearch({ open, onOpenChange }: AIGlobalSearchProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { cotacoes } = useCotacoes();
  const { pedidos } = usePedidos();

  // Buscar itens de pedidos para análise de preços
  const { data: orderItems = [] } = useQuery({
    queryKey: ["order-items-for-ai"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_name, unit_price, quantity, total_price")
        .order("created_at", { ascending: false })
        .limit(1000);
      return data || [];
    },
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

  // Atalho de teclado
  useEffect(() => {
    if (isMobile) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange, isMobile]);

  // Limpar ao fechar
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setAiResponse("");
      setConversationHistory([]);
    }
  }, [open]);

  const handleAskAI = async () => {
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
      });

      setAiResponse(response);
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="relative flex flex-col h-[80vh] max-h-[600px] overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="relative flex items-center px-3 sm:px-4 py-3 sm:py-3.5 gap-2 sm:gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Assistente de Cotações</h3>
              <p className="text-xs text-muted-foreground">Pergunte sobre produtos, fornecedores, preços...</p>
            </div>
            {!isMobile && (
              <kbd className="hidden sm:inline-flex h-6 px-2 select-none items-center justify-center rounded border border-input bg-muted font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Conversation Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto">
          <div className="p-4">
          {conversationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-8 text-center">
              <div className="relative mb-6">
                <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20 w-20 h-20 mx-auto flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Faça perguntas sobre seu sistema de cotações
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {[
                  "Quanto gastei em novembro de 2025?",
                  "Quanto já gastei com a Holambra?",
                  "Qual o valor médio pago no arroz?",
                  "Qual o menor preço do feijão?",
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(example)}
                    className="text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {conversationHistory.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 h-fit">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
                  )}
                  <div className={cn("rounded-lg p-3 max-w-[80%]", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 h-fit">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="rounded-lg p-3 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-background p-3 sm:p-4 shrink-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <CommandInput
                placeholder="Faça uma pergunta..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="border border-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <Button
              onClick={handleAskAI}
              disabled={!searchQuery.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}


export function AIGlobalSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={onClick}
            className={cn(
              "relative transition-all duration-200 active:scale-95 touch-manipulation",
              "w-9 h-9 p-0 rounded-lg md:w-full md:h-10 md:px-4 md:justify-start",
              "bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-400/20 dark:to-purple-400/20",
              "border border-violet-200 dark:border-violet-800 hover:from-violet-500/20 hover:to-purple-500/20"
            )}
          >
            {/* Mobile: apenas ícone */}
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400 md:hidden" />
            
            {/* Desktop: barra completa */}
            <div className="hidden md:flex items-center w-full gap-3">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
              <span className="text-muted-foreground font-normal flex-1 text-left text-sm truncate">
                Pergunte ao assistente de IA...
              </span>
              <kbd className="hidden lg:inline-flex h-5 px-1.5 select-none items-center justify-center rounded border border-input bg-muted font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="hidden md:block">
          <p className="text-xs">Assistente de IA • Pressione <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px] font-mono">⌘K</kbd></p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
