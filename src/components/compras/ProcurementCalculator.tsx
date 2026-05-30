import { useState, useEffect, useCallback } from "react";
import { Calculator, RotateCcw, Copy, Check, History, Percent, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CalculationStep {
  formula: string;
  result: string;
}

export default function ProcurementCalculator() {
  const [display, setDisplay] = useState("0");
  const [formula, setFormula] = useState("");
  const [history, setHistory] = useState<CalculationStep[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  const calculate = useCallback((expression: string) => {
    try {
      let processedExpr = expression
        .replace(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 + $2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)%/g, '($1 * (1 - $2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)%/g, '($1 * ($2/100))')
        .replace(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)%/g, '($1 / ($2/100))')
        .replace(/x/g, '*')
        .replace(/÷/g, '/');

      const result = new Function(`return ${processedExpr}`)();
      return Number.isInteger(result)
        ? result.toString()
        : parseFloat(result.toFixed(4)).toString();
    } catch {
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
        setHistory(prev => [{ formula: fullExpression, result }, ...prev].slice(0, 10));
        setDisplay(result);
        setFormula("");
      } else {
        toast({ title: "Erro no cálculo", variant: "destructive" });
      }
    } else if (["+", "-", "x", "÷"].includes(value)) {
      if (display === "Erro") return;
      setFormula(display + " " + value + " ");
      setDisplay("0");
    } else if (value === "%") {
      if (display === "0" || display === "Erro") return;
      setDisplay(prev => prev + "%");
    } else if (value === "⌫") {
      setDisplay(prev => (prev.length <= 1 || prev === "Erro") ? "0" : prev.slice(0, -1));
    } else {
      setDisplay(prev => {
        if (prev === "0" && value !== ".") return value;
        if (prev === "Erro") return value;
        if (value === "." && prev.includes(".")) return prev;
        return prev + value;
      });
    }
  }, [calculate, display, formula, toast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleAction(e.key);
      else if (e.key === "+") handleAction("+");
      else if (e.key === "-") handleAction("-");
      else if (e.key === "*") handleAction("x");
      else if (e.key === "/") { e.preventDefault(); handleAction("÷"); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); handleAction("="); }
      else if (e.key === "Escape" || e.key === "c" || e.key === "C") handleAction("C");
      else if (e.key === "Backspace") handleAction("⌫");
      else if (e.key === "." || e.key === ",") handleAction(".");
      else if (e.key === "%") handleAction("%");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: "Valor copiado" });
  };

  const applyQuickPercentage = (pct: number, type: 'add' | 'sub' | 'margin') => {
    const base = parseFloat(display);
    if (isNaN(base)) return;
    let result = 0;
    if (type === 'add') result = base * (1 + pct / 100);
    else if (type === 'sub') result = base * (1 - pct / 100);
    else result = base / (1 - pct / 100);
    const formatted = parseFloat(result.toFixed(4)).toString();
    setHistory(prev => [{
      formula: `${base} ${type === 'add' ? '+' : type === 'sub' ? '-' : 'margem'} ${pct}%`,
      result: formatted
    }, ...prev].slice(0, 10));
    setDisplay(formatted);
  };

  const KEYPAD = ["7","8","9","÷","4","5","6","x","1","2","3","-","0",".","⌫","+"];
  const OPERATORS = ["÷","x","-","+"];

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-white/5">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-brand" />
          <span className="text-sm font-bold">Calculadora</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleAction("C")} className="h-7 gap-1.5 text-xs text-muted-foreground">
          <RotateCcw className="h-3 w-3" />
          Limpar
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Display */}
        <div className="relative group bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-border dark:border-white/5 px-4 py-3 min-h-[72px] flex flex-col justify-between">
          <span className="text-[10px] font-mono text-muted-foreground truncate">{formula || " "}</span>
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "text-2xl font-mono font-bold tracking-tight truncate flex-1 text-right",
              display === "Erro" ? "text-red-500" : "text-foreground"
            )}>
              {display}
            </span>
            <button
              onClick={copyToClipboard}
              className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1.5">
          {KEYPAD.map((btn) => (
            <button
              key={btn}
              onClick={() => handleAction(btn)}
              className={cn(
                "h-11 rounded-xl text-sm font-bold transition-all active:scale-95 touch-manipulation",
                OPERATORS.includes(btn)
                  ? "bg-brand/8 hover:bg-brand/15 text-brand border border-brand/20"
                  : btn === "⌫"
                  ? "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground"
              )}
            >
              {btn}
            </button>
          ))}
          {/* % button */}
          <button
            onClick={() => handleAction("%")}
            className="h-11 rounded-xl text-sm font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-muted-foreground transition-all active:scale-95 touch-manipulation"
          >
            %
          </button>
          {/* = button (3 cols) */}
          <button
            onClick={() => handleAction("=")}
            className="col-span-3 h-11 rounded-xl text-base font-bold bg-brand hover:bg-brand/90 text-white transition-all active:scale-95 shadow-md shadow-brand/20 touch-manipulation"
          >
            =
          </button>
        </div>

        {/* Quick percentages */}
        <div className="space-y-2 pt-1 border-t border-border dark:border-white/5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
            <Percent className="h-3 w-3" /> Atalhos
          </p>
          <div className="grid grid-cols-3 gap-1">
            {[5,10,20].map(p => (
              <button key={`a${p}`} onClick={() => applyQuickPercentage(p, 'add')}
                className="h-8 rounded-lg text-[11px] font-bold border border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-muted-foreground transition-all active:scale-95">
                +{p}%
              </button>
            ))}
            {[5,10,20].map(p => (
              <button key={`s${p}`} onClick={() => applyQuickPercentage(p, 'sub')}
                className="h-8 rounded-lg text-[11px] font-bold border border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 text-muted-foreground transition-all active:scale-95">
                -{p}%
              </button>
            ))}
            {[20,30,40].map(p => (
              <button key={`m${p}`} onClick={() => applyQuickPercentage(p, 'margin')}
                className="h-8 rounded-lg text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-brand/10 hover:text-brand text-muted-foreground transition-all active:scale-95">
                {p}% mg
              </button>
            ))}
          </div>
        </div>

        {/* History toggle */}
        {history.length > 0 && (
          <div className="border-t border-border dark:border-white/5 pt-2">
            <button
              onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span className="flex items-center gap-1.5">
                <History className="h-3 w-3" /> Histórico ({history.length})
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showHistory && "rotate-180")} />
            </button>
            {showHistory && (
              <div className="mt-1 space-y-0.5 max-h-36 overflow-y-auto">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDisplay(item.result)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground truncate">{item.formula}</span>
                    <span className="text-sm font-mono font-bold text-foreground ml-2 shrink-0">= {item.result}</span>
                  </button>
                ))}
                <button
                  onClick={() => setHistory([])}
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors py-1 text-center"
                >
                  Apagar histórico
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
