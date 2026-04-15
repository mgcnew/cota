import { useState, useEffect, useRef, useCallback } from "react";
import { Calculator, RotateCcw, Copy, Check, History, Percent, Keyboard as KeyboardIcon, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { useToast } from "@/hooks/use-toast";

interface CalculationStep {
  formula: string;
  result: string;
  timestamp: Date;
}

export default function ProcurementCalculator() {
  const [display, setDisplay] = useState("0");
  const [formula, setFormula] = useState("");
  const [history, setHistory] = useState<CalculationStep[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const displayRef = useRef<HTMLDivElement>(null);

  const calculate = useCallback((expression: string) => {
    try {
      // Basic safety: only allow numbers and operators
      // Replace % logic: X + 10% -> X * 1.10
      let processedExpr = expression
        .replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 + $2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 - $2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)%/g, '($1 * ($2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)%/g, '($1 / ($2/100))')
        .replace(/x/g, '*')
        .replace(/÷/g, '/');

      // Use Function instead of eval for a bit more control, though still careful with inputs
      // In a production app, a math library like mathjs would be better
      const result = new Function(`return ${processedExpr}`)();
      
      const formattedResult = Number.isInteger(result) 
        ? result.toString() 
        : parseFloat(result.toFixed(4)).toString();

      return formattedResult;
    } catch (e) {
      return "Erro";
    }
  }, []);

  const handleAction = useCallback((value: string) => {
    if (value === "C") {
      setDisplay("0");
      setFormula("");
    } else if (value === "=") {
      if (formula === "" && display === "0") return;
      
      const fullExpression = formula + display;
      const result = calculate(fullExpression);
      
      if (result !== "Erro") {
        setHistory(prev => [{
          formula: fullExpression,
          result: result,
          timestamp: new Date()
        }, ...prev].slice(0, 10));
        setDisplay(result);
        setFormula("");
      } else {
        toast({
          title: "Erro no cálculo",
          description: "Verifique a expressão informada.",
          variant: "destructive"
        });
      }
    } else if (["+", "-", "x", "÷"].includes(value)) {
      if (display === "Erro") return;
      setFormula(display + " " + value + " ");
      setDisplay("0");
    } else if (value === "%") {
      if (display === "0" || display === "Erro") return;
      setDisplay(prev => prev + "%");
    } else if (value === "backspace") {
      setDisplay(prev => {
        if (prev.length <= 1 || prev === "Erro") return "0";
        return prev.slice(0, -1);
      });
    } else {
      // Numbers and dot
      setDisplay(prev => {
        if (prev === "0" && value !== ".") return value;
        if (prev === "Erro") return value;
        if (value === "." && prev.includes(".")) return prev;
        return prev + value;
      });
    }
  }, [calculate, display, formula, toast]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleAction(e.key);
      } else if (e.key === "+" || e.key === "-") {
        handleAction(e.key);
      } else if (e.key === "*") {
        handleAction("x");
      } else if (e.key === "/") {
        e.preventDefault();
        handleAction("÷");
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleAction("=");
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        handleAction("C");
      } else if (e.key === "Backspace") {
        handleAction("backspace");
      } else if (e.key === "." || e.key === ",") {
        handleAction(".");
      } else if (e.key === "%") {
        handleAction("%");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      description: "Valor copiado para a área de transferência",
    });
  };

  const applyQuickPercentage = (pct: number, type: 'add' | 'sub' | 'margin') => {
    const base = parseFloat(display);
    if (isNaN(base)) return;

    let result = 0;
    if (type === 'add') result = base * (1 + pct / 100);
    else if (type === 'sub') result = base * (1 - pct / 100);
    else if (type === 'margin') result = base / (1 - pct / 100);

    const formattedResult = parseFloat(result.toFixed(4)).toString();
    
    setHistory(prev => [{
      formula: `${base} ${type === 'add' ? '+' : type === 'sub' ? '-' : 'markup'} ${pct}%`,
      result: formattedResult,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
    
    setDisplay(formattedResult);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Calculadora Principal */}
      <Card className={cn("lg:col-span-2 overflow-hidden border-none shadow-xl bg-white dark:bg-[#1A1C20]")}>
        <CardHeader className="pb-4 bg-muted/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand/10 rounded-lg">
                <Calculator className="h-5 w-5 text-brand" />
              </div>
              <div>
                <CardTitle className="text-lg">Calculadora de Compras</CardTitle>
                <CardDescription>Otimizada para cálculos de margem e impostos</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAction("C")}
                className="h-8 gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar (Esc)
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Display */}
          <div className="relative group">
            <div className="absolute top-2 left-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              {formula || "Expressão"}
            </div>
            <div 
              className={cn(
                "w-full h-24 flex items-end justify-end p-4 text-4xl font-mono tracking-tighter bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-all group-hover:border-brand/30",
                display === "Erro" ? "text-red-500" : "text-foreground"
              )}
            >
              {display}
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Teclado Numérico e Operadores */}
            <div className="grid grid-cols-4 gap-2">
              {[ "7", "8", "9", "÷", "4", "5", "6", "x", "1", "2", "3", "-", "0", ".", "%", "+" ].map((btn) => (
                <Button
                  key={btn}
                  variant={["÷", "x", "-", "+"].includes(btn) ? "secondary" : "outline"}
                  className={cn(
                    "h-14 text-lg font-bold rounded-xl transition-all active:scale-95",
                    ["÷", "x", "-", "+"].includes(btn) ? "bg-brand/5 hover:bg-brand/10 text-brand border-brand/20" : "hover:border-brand/30"
                  )}
                  onClick={() => handleAction(btn)}
                >
                  {btn}
                </Button>
              ))}
              <Button
                className="col-span-4 h-14 text-xl font-bold rounded-xl shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white"
                onClick={() => handleAction("=")}
              >
                =
              </Button>
            </div>

            {/* Atalhos de Porcentagem e Margem */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Percent className="h-3 w-3" /> Acréscimos (+%)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15, 20, 30, 50].map(p => (
                    <Button 
                      key={p} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickPercentage(p, 'add')}
                      className="h-10 text-xs font-bold border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      +{p}%
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Percent className="h-3 w-3" /> Descontos (-%)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15, 20, 30, 50].map(p => (
                    <Button 
                      key={p} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyQuickPercentage(p, 'sub')}
                      className="h-10 text-xs font-bold border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                    >
                      -{p}%
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Cálculo de Margem (Divisão por 1-%)
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1 cursor-help"><KeyboardIcon className="h-3 w-3 text-muted-foreground" /></div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-[10px]">
                        Calcula o preço de venda para atingir a margem desejada. Fórmula: Custo / (1 - Margem/100)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30, 35, 40, 50].map(p => (
                    <Button 
                      key={p} 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => applyQuickPercentage(p, 'margin')}
                      className="h-10 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-brand/10 hover:text-brand"
                    >
                      {p}% Margem
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="border-none shadow-xl bg-white dark:bg-[#1A1C20] flex flex-col">
        <CardHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand" />
            <CardTitle className="text-lg">Histórico de Cálculos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-auto max-h-[600px]">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground">
              <RotateCcw className="h-8 w-8 mb-4 opacity-20" />
              <p className="text-sm">Nenhum cálculo recente</p>
              <p className="text-[10px] uppercase font-bold tracking-tighter mt-1 opacity-50">Os resultados aparecerão aqui</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => setDisplay(item.result)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.formula}</span>
                    <span className="text-[9px] text-zinc-400">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-mono font-bold tracking-tighter text-foreground">= {item.result}</span>
                    <ChevronRight className="h-4 w-4 text-brand opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {history.length > 0 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-[10px] font-black uppercase tracking-widest h-8"
              onClick={() => setHistory([])}
            >
              Apagar Histórico
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
