import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import {
  Search, Package, Building2, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, FileText, Calendar, Award,
  History, RefreshCw, PieChart, BarChart3, Lightbulb, CheckCircle2, AlertTriangle,
  ArrowRight, Target, Zap, Info, Clock,
  PiggyBank,
  CheckCircle, Loader2, AlertCircle, Sparkles
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { designSystem as ds } from "@/styles/design-system";
import { generateExecutiveSummary } from "@/lib/gemini";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type SearchType = "packaging" | "supplier";
type SelectedItem = { type: SearchType; id: string; name: string };

// --- COMPONENTES AUXILIARES (DEFINIDOS PRIMEIRO PARA EVITAR REFERENCE ERROR) ---

function MetricCard({ icon, label, value, subtitle, color, tooltip }: any) {
  const colorMap: any = {
    blue: "text-blue-600 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50",
    green: "text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50",
    violet: "text-violet-600 bg-violet-50/50 dark:bg-violet-900/20 border-violet-200/50 dark:border-violet-800/50",
    amber: "text-amber-600 bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50",
    red: "text-red-600 bg-red-50/50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50",
    gray: "text-gray-600 bg-gray-50/50 dark:bg-gray-900/20 border-gray-200/50 dark:border-gray-800/50",
  };
  return (
    <div className={cn(ds.components.card.root, "p-5 relative overflow-hidden group hover:scale-[1.02] transition-all", colorMap[color])}>
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={cn("p-2 rounded-xl bg-white/50 dark:bg-white/10 backdrop-blur-sm shadow-sm transition-transform group-hover:rotate-12", colorMap[color])}>
          {icon}
        </div>
        <span className={cn(ds.typography.size.xs, ds.typography.weight.extrabold, "uppercase tracking-widest opacity-70")}>{label}</span>
      </div>
      <p className={cn(ds.typography.size.xl, ds.typography.weight.extrabold, ds.colors.text.primary, "relative z-10 tracking-tight")}>{value}</p>
      {subtitle && <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50 mt-1 relative z-10")}>{subtitle}</p>}
      
      {/* Decoration */}
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]">
        {icon && typeof icon !== 'string' ? <div className="scale-[4]">{icon}</div> : null}
      </div>
    </div>
  );
}

function InsightCard({ icon, title, value, subtitle, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return (
    <div className={cn(ds.components.card.flat, "p-5 relative overflow-hidden group hover:shadow-md transition-all", colorMap[color])}>
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className={cn(ds.typography.size.xs, ds.typography.weight.extrabold, "uppercase tracking-widest opacity-60")}>{title}</p>
          <p className={cn(ds.typography.size.lg, ds.typography.weight.extrabold, ds.colors.text.primary, "tracking-tight")}>{value}</p>
          <p className={cn("text-[11px] font-bold opacity-60", ds.colors.text.secondary)}>{subtitle}</p>
        </div>
        <div className={cn("p-3 rounded-2xl bg-white/50 dark:bg-white/10 backdrop-blur-sm shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6", colorMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AiExecutiveSummaryCard({ data }: { data: any }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await generateExecutiveSummary(data);
      setSummary(res.replace(/\*\*/g, ''));
    } catch (e) {
      console.error(e);
      setSummary("Não foi possível gerar os insights agora.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!summary && !isLoading) {
    return (
      <Button 
        onClick={handleGenerate} 
        className={cn(ds.components.button.base, ds.components.button.variants.primary, "w-full h-12 rounded-2xl group shadow-sm transition-all duration-500")}
      >
        <Sparkles className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-500" />
        Gerar Insights com IA
      </Button>
    )
  }

  return (
    <div className={cn("p-6 rounded-2xl border shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-700", ds.colors.surface.card)}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center gap-2 text-brand font-semibold text-sm">
          <Sparkles className={cn("h-4 w-4", isLoading && "animate-pulse")} />
          {isLoading ? "A Inteligência Artificial está analisando os dados..." : "Insights Executivos da IA"}
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse w-3/4" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse w-full" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md animate-pulse w-5/6" />
          </div>
        ) : (
          <div className="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {summary?.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="flex gap-2 items-start">
                <span className="text-brand mt-1">•</span>
                <span>{line.replace(/^-\s*/, '')}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PriceHistoryList({ history }: { history: any[] }) {
  return (
    <div className="overflow-hidden custom-scrollbar max-h-[400px]">
      <Table className={ds.components.table.root}>
        <TableHeader className={ds.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={4} className="px-1 pb-3 pt-0 border-none">
              <div className={ds.components.table.headerContainer}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className={ds.components.table.headerIcon}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className={ds.components.table.headerLabel}>Tipo</span>
                </div>
                <div className="w-[45%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Fornecedor</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Data</span>
                </div>
                <div className="w-[20%] text-right flex justify-end items-center px-2">
                  <span className={ds.components.table.headerLabel}>Preço</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground italic gap-3 border-none">
                <div className="flex flex-col items-center justify-center">
                  <div className="p-3 rounded-full bg-muted/30"><AlertCircle className="h-6 w-6 opacity-30" /></div>
                  <span className="text-sm font-medium mt-2">Sem histórico disponível</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            history.map((item, idx) => (
              <TableRow key={idx} className="group border-none hover:bg-transparent">
                <TableCell colSpan={4} className={ds.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", ds.components.table.row)}>
                    <div className="w-[15%] flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        item.type === "order" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                      )}>
                        {item.type === "order" ? <ShoppingCart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", ds.colors.text.secondary, "opacity-50")}>
                        {item.type === 'order' ? 'Pedido' : 'Cotação'}
                      </span>
                    </div>
                    <div className="w-[45%] pl-2">
                      <p className={cn("font-bold text-sm", ds.colors.text.primary)}>{item.supplier}</p>
                    </div>
                    <div className="w-[20%] pl-2">
                      <p className={cn("text-xs font-medium", ds.colors.text.secondary)}>
                        {(() => {
                          const [y, m, d] = item.date.split('T')[0].split('-').map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
                        })()}
                      </p>
                    </div>
                    <div className="w-[20%] text-right px-2">
                      <span className={cn("font-black italic text-base", ds.colors.text.primary)}>
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SupplierComparison({ orders, quotes }: { orders: any[]; quotes: any[] }) {
  const supplierData = useMemo(() => {
    const data: Record<string, { 
      name: string; 
      avgPrice: number; 
      count: number; 
      prices: number[]; 
      avgLeadTime: number; 
      leadTimes: number[] 
    }> = {};
    
    orders.forEach((o: any) => { 
      const name = o.packaging_orders?.supplier_name; 
      if (name && o.valor_unitario > 0) { 
        if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [], avgLeadTime: 0, leadTimes: [] }; 
        data[name].prices.push(o.valor_unitario); 
        data[name].count += 1;
        
        if (o.packaging_orders?.order_date && o.created_at) {
          const [y, m, d] = o.packaging_orders.order_date.split('T')[0].split('-').map(Number);
          const orderDate = new Date(y, m - 1, d);
          const createdAt = new Date(o.created_at);
          data[name].leadTimes.push(Math.max(0, Math.ceil((createdAt.getTime() - orderDate.getTime()) / (1000 * 3600 * 24))));
        }
      } 
    });
    
    quotes.forEach((q: any) => { 
      const name = q.supplier?.name; 
      if (name && q.custo_por_unidade > 0) { 
        if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [], avgLeadTime: 0, leadTimes: [] }; 
        data[name].prices.push(q.custo_por_unidade); 
        data[name].count += 1; 
      } 
    });

    return Object.values(data).map(d => ({ 
      ...d, 
      avgPrice: d.prices.reduce((a, b) => a + b, 0) / d.prices.length,
      avgLeadTime: d.leadTimes.length > 0 ? d.leadTimes.reduce((a, b) => a + b, 0) / d.leadTimes.length : 0
    })).sort((a, b) => a.avgPrice - b.avgPrice);
  }, [orders, quotes]);
  
  if (supplierData.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic gap-3 border-none">
      <div className="p-3 rounded-full bg-muted/30"><Building2 className="h-6 w-6 opacity-30" /></div>
      <span className="text-sm font-medium">Nenhum fornecedor encontrado</span>
    </div>
  );
  
  const minPrice = Math.min(...supplierData.map(s => s.avgPrice));
  return (
    <div className="overflow-hidden custom-scrollbar max-h-[400px]">
      <Table className={ds.components.table.root}>
        <TableHeader className={ds.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={4} className="px-1 pb-3 pt-0 border-none">
              <div className={ds.components.table.headerContainer}>
                <div className="w-[10%] flex items-center gap-3">
                  <span className={ds.components.table.headerLabel}>Pos</span>
                </div>
                <div className="w-[45%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Fornecedor</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Registros</span>
                </div>
                <div className="w-[25%] text-right flex justify-end items-center px-2">
                  <span className={ds.components.table.headerLabel}>Preço Médio</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supplierData.map((supplier, index) => {
            const minLeadTime = Math.min(...supplierData.filter(s => s.avgLeadTime > 0).map(s => s.avgLeadTime));
            const isFastest = supplier.avgLeadTime > 0 && supplier.avgLeadTime === minLeadTime;
            
            return (
              <TableRow key={supplier.name} className="group border-none hover:bg-transparent">
                <TableCell colSpan={4} className={ds.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", ds.components.table.row)}>
                    <div className="w-[10%] flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] border transition-colors",
                        index === 0 ? "bg-brand text-white border-brand" : "bg-muted text-muted-foreground border-border/50"
                      )}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="w-[45%] pl-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-sm", ds.colors.text.primary)}>{supplier.name}</span>
                          {index === 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest px-1.5 h-4">Melhor preço</Badge>}
                          {isFastest && <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase tracking-widest px-1.5 h-4">Mais Rápido</Badge>}
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", ds.colors.text.secondary)}>
                          {supplier.avgLeadTime > 0 ? `Entrega em ~${supplier.avgLeadTime.toFixed(0)} dias` : "Prazo sob consulta"}
                        </span>
                      </div>
                    </div>
                    <div className="w-[20%] pl-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-50", ds.colors.text.secondary)}>{supplier.count} registro(s)</p>
                    </div>
                    <div className="w-[25%] text-right px-2 flex flex-col items-end">
                      <span className={cn("font-black text-base italic", ds.colors.text.primary)}>{formatCurrency(supplier.avgPrice)}</span>
                      {index > 0 && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-0.5">+{((supplier.avgPrice - minPrice) / minPrice * 100).toFixed(0)}% gap</span>}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderHistoryList({ orders }: { orders: any[] }) {
  return (
    <div className="overflow-hidden custom-scrollbar">
      <Table className={ds.components.table.root}>
        <TableHeader className={ds.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={5} className="px-1 pb-3 pt-0 border-none">
              <div className={ds.components.table.headerContainer}>
                <div className="w-[20%] flex items-center gap-3">
                  <div className={ds.components.table.headerIcon}>
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className={ds.components.table.headerLabel}>ID / Status</span>
                </div>
                <div className="w-[40%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Data</span>
                </div>
                <div className="w-[15%] pl-2 flex justify-center items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Itens</span>
                </div>
                <div className="w-[25%] text-right flex justify-end items-center px-2">
                  <span className={ds.components.table.headerLabel}>Valor</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic border-none">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 rounded-full bg-muted/30"><ShoppingCart className="h-6 w-6 opacity-30" /></div>
                  <span className="text-sm font-medium">Nenhum pedido realizado</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="group border-none hover:bg-transparent">
                <TableCell colSpan={5} className={ds.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", ds.components.table.row)}>
                    <div className="w-[20%] flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">#ORD-{order.id.substring(0, 8)}</span>
                      <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest bg-muted/50 text-muted-foreground border-border/50">{order.status}</Badge>
                    </div>
                    <div className="w-[40%] pl-2">
                      <p className={cn("text-xs font-bold flex items-center gap-1.5 opacity-60", ds.colors.text.secondary)}>
                        <Calendar className="h-3 w-3" />
                        {(() => {
                          const [y, m, d] = order.order_date.split('T')[0].split('-').map(Number);
                          return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
                        })()}
                      </p>
                    </div>
                    <div className="w-[15%] flex justify-center items-center pl-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{order.packaging_order_items?.length || 0}</span>
                      </div>
                    </div>
                    <div className="w-[25%] text-right px-2">
                      <p className={cn("text-base font-black tracking-tight italic", ds.colors.text.primary)}>
                        {formatCurrency(Number(order.total_value))}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TopPackagingList({ packaging }: { packaging: Array<{ name: string; quantity: number; totalSpent: number; count: number }> }) {
  if (packaging.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic gap-3">
      <div className="p-3 rounded-full bg-muted/30"><Package className="h-6 w-6 opacity-30" /></div>
      <span className="text-sm font-medium">Nenhuma embalagem encontrada</span>
    </div>
  );
  return (
    <div className="overflow-hidden custom-scrollbar max-h-[400px]">
      <Table className={ds.components.table.root}>
        <TableHeader className={ds.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={4} className="px-1 pb-3 pt-0 border-none">
              <div className={ds.components.table.headerContainer}>
                <div className="w-[10%] flex items-center gap-3">
                  <span className={ds.components.table.headerLabel}>Pos</span>
                </div>
                <div className="w-[45%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Embalagem</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={ds.components.table.headerLabel}>Pedidos</span>
                </div>
                <div className="w-[25%] text-right flex justify-end items-center px-2">
                  <span className={ds.components.table.headerLabel}>Total Gasto</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packaging.map((item, index) => (
            <TableRow key={item.name} className="group border-none hover:bg-transparent">
              <TableCell colSpan={4} className={ds.components.table.cell}>
                <div className={cn("flex items-center px-4 py-3 mb-1", ds.components.table.row)}>
                  <div className="w-[10%] flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] border transition-colors",
                      index < 3 ? "bg-brand text-white border-brand" : "bg-muted text-muted-foreground border-border/50"
                    )}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="w-[45%] pl-2">
                    <span className={cn("font-bold text-sm block", ds.colors.text.primary)}>{item.name}</span>
                  </div>
                  <div className="w-[20%] pl-2">
                    <p className={cn("font-medium text-[10px] uppercase tracking-widest opacity-70", ds.colors.text.secondary)}>
                      {item.count} vez(es) • {item.quantity} un
                    </p>
                  </div>
                  <div className="w-[25%] text-right px-2">
                    <p className={cn("font-black text-base italic text-emerald-600 dark:text-emerald-400")}>
                      {formatCurrency(item.totalSpent)}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// --- SUB-TELA EM BRANCO ---

function EmptyState() {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed",
      ds.colors.border.subtle,
      "bg-muted/20"
    )}>
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-8 animate-pulse",
        ds.colors.surface.card,
        "shadow-xl"
      )}>
        <Target className="h-12 w-12 text-brand" />
      </div>
      <h3 className={cn(ds.typography.size.xl, ds.typography.weight.bold, ds.colors.text.primary, "mb-3")}>
        Pronto para analisar?
      </h3>
      <p className={cn(ds.typography.size.sm, ds.colors.text.secondary, "max-w-sm mx-auto opacity-70 mb-8")}>
        Selecione uma embalagem ou fornecedor para visualizar métricas detalhadas e histórico de preços.
      </p>
    </div>
  );
}

// --- TELAS DE ANÁLISE ---

function PackagingAnalysis({ packagingId, packagingName, onClear }: { packagingId: string; packagingName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("30"); // dias

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["packaging-analysis-quotes", packagingId, timeFilter],
    queryFn: async () => {
      let query = supabase.from("packaging_supplier_items" as any).select("*").eq("packaging_id", packagingId).gt("valor_total", 0);
      
      if (timeFilter !== "all") {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(timeFilter));
        query = query.gte("created_at", date.toISOString());
      }
      
      const { data } = await (query.order("created_at", { ascending: false }) as any);
      if (!data || data.length === 0) return [];
      const supplierIds = [...new Set(data.map((d: any) => d.supplier_id))] as string[];
      const { data: suppliersData } = await supabase.from("suppliers").select("id, name").in("id", supplierIds);
      const suppliersMap = new Map(suppliersData?.map(s => [s.id, s]) || []);
      return data.map((item: any) => ({ ...item, supplier: suppliersMap.get(item.supplier_id) }));
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["packaging-analysis-orders", packagingId, timeFilter],
    queryFn: async () => {
      let query = supabase.from("packaging_order_items" as any).select("*, packaging_orders!inner(id, status, order_date, supplier_name, supplier_id)");
      
      if (timeFilter !== "all") {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(timeFilter));
        query = query.gte("created_at", date.toISOString());
      }
      
      const { data } = await (query.eq("packaging_id", packagingId).order("created_at", { ascending: false }) as any);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const quotePrices = quotes.map((q: any) => q.custo_por_unidade || 0).filter((p: number) => p > 0);
    const orderPrices = orders.map((o: any) => o.valor_unitario || 0).filter((p: number) => p > 0);
    const allPrices = [...quotePrices, ...orderPrices];
    const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
    
    // Cálculo de Lead Time (Diferença entre pedido e entrega se disponível)
    const leadTimes = orders
      .filter((o: any) => o.packaging_orders?.order_date && o.created_at)
      .map((o: any) => {
        const [y, m, d] = o.packaging_orders.order_date.split('T')[0].split('-').map(Number);
        const orderDate = new Date(y, m - 1, d);
        const createdAt = new Date(o.created_at);
        return Math.max(0, Math.ceil((createdAt.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)));
      });
    const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

    const supplierSet = new Set<string>();
    quotes.forEach((q: any) => q.supplier?.name && supplierSet.add(q.supplier.name));
    orders.forEach((o: any) => o.packaging_orders?.supplier_name && supplierSet.add(o.packaging_orders.supplier_name));
    const recentPrices = orderPrices.slice(0, 5);
    const olderPrices = orderPrices.slice(5, 10);
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;
    if (recentPrices.length > 0 && olderPrices.length > 0) {
      const recentAvg = recentPrices.reduce((a: number, b: number) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((a: number, b: number) => a + b, 0) / olderPrices.length;
      trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      trend = Math.abs(trendPercent) < 2 ? "stable" : trendPercent > 0 ? "up" : "down";
    }
    const supplierPrices: Record<string, number[]> = {};
    orders.forEach((o: any) => { const name = o.packaging_orders?.supplier_name; if (name && o.valor_unitario > 0) { if (!supplierPrices[name]) supplierPrices[name] = []; supplierPrices[name].push(o.valor_unitario); } });
    let bestSupplier = { name: "-", avgPrice: 0 };
    Object.entries(supplierPrices).forEach(([name, prices]) => { const avg = prices.reduce((a, b) => a + b, 0) / prices.length; if (!bestSupplier.avgPrice || avg < bestSupplier.avgPrice) { bestSupplier = { name, avgPrice: avg }; } });
    // Cálculo de Economia Perdida (Custo de Oportunidade)
    // Para cada pedido, comparamos o valor unitário pago com o menor preço disponível na época
    let lostSavings = 0;
    orders.forEach((order: any) => {
      if (order.valor_unitario > minPrice && minPrice > 0) {
        lostSavings += (order.valor_unitario - minPrice) * (order.quantidade || 0);
      }
    });

    return { 
      totalQuotes: quotes.length, 
      totalOrders: orders.length, 
      totalQuantity: orders.reduce((sum: number, o: any) => sum + (o.quantidade || 0), 0), 
      totalSpent: orders.reduce((sum: number, o: any) => sum + (o.valor_total || 0), 0), 
      avgPrice, 
      minPrice, 
      maxPrice, 
      uniqueSuppliers: supplierSet.size, 
      trend, 
      trendPercent, 
      bestSupplier,
      avgLeadTime,
      lostSavings
    };
  }, [quotes, orders]);

  const priceHistory = useMemo(() => {
    const history: Array<{ date: string; price: number; supplier: string; type: "quote" | "order" }> = [];
    quotes.forEach((q: any) => { history.push({ date: q.created_at, price: q.custo_por_unidade || 0, supplier: q.supplier?.name || "Desconhecido", type: "quote" }); });
    orders.forEach((o: any) => { history.push({ date: o.packaging_orders?.order_date || o.created_at, price: o.valor_unitario || 0, supplier: o.packaging_orders?.supplier_name || "Desconhecido", type: "order" }); });
    return history.filter(h => h.price > 0).sort((a, b) => {
      const [ay, am, ad] = a.date.split('T')[0].split('-').map(Number);
      const [by, bm, bd] = b.date.split('T')[0].split('-').map(Number);
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    }).slice(0, 20);
  }, [quotes, orders]);

  const isLoading = quotesLoading || ordersLoading;
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className={cn(
        "flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl shadow-xl overflow-hidden relative gap-4 border border-brand/10",
        ds.colors.surface.card
      )}>
        <div className="absolute right-0 top-0 w-32 h-full bg-brand/5 skew-x-[-20deg] translate-x-16 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-brand/5 backdrop-blur-md border border-brand/10">
            <Package className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, ds.colors.text.primary, "tracking-tight")}>
              {packagingName}
            </h2>
            <p className="text-zinc-500 text-sm font-medium">Análise detalhada de embalagem</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10 self-end md:self-auto">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10 rounded-xl">
              <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className={ds.colors.surface.card}>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onClear} className={cn(ds.components.button.base, ds.components.button.variants.secondary, "font-bold h-10")}>
            Fechar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard icon={<FileText className="h-4 w-4" />} label="Cotações" value={metrics.totalQuotes.toString()} color="blue" />
        <MetricCard icon={<ShoppingCart className="h-4 w-4" />} label="Pedidos" value={metrics.totalOrders.toString()} color="green" />
        <MetricCard icon={<DollarSign className="h-4 w-4" />} label="Preço Médio" value={formatCurrency(metrics.avgPrice)} color="violet" />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Lead Time" value={metrics.avgLeadTime > 0 ? `${metrics.avgLeadTime.toFixed(0)}d` : "-"} subtitle="Média entrega" color="amber" />
        <MetricCard icon={metrics.trend === "up" ? <TrendingUp className="h-4 w-4" /> : metrics.trend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />} label="Tendência" value={metrics.trend === "stable" ? "Estável" : `${metrics.trendPercent > 0 ? "+" : ""}${metrics.trendPercent.toFixed(1)}%`} color={metrics.trend === "up" ? "red" : metrics.trend === "down" ? "green" : "gray"} />
        <MetricCard icon={<PiggyBank className="h-4 w-4" />} label="Perda Econ." value={formatCurrency(metrics.lostSavings)} color="red" tooltip="Quanto você deixou de economizar em relação ao melhor preço" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard icon={<Target className="h-5 w-5" />} title="Melhor Fornecedor" value={metrics.bestSupplier.name} subtitle={metrics.bestSupplier.avgPrice > 0 ? `Média: ${formatCurrency(metrics.bestSupplier.avgPrice)}` : "Sem dados"} color="emerald" />
        <InsightCard icon={<DollarSign className="h-5 w-5" />} title="Faixa de Preço" value={metrics.minPrice > 0 ? `${formatCurrency(metrics.minPrice)} - ${formatCurrency(metrics.maxPrice)}` : "-"} subtitle={`Variação: ${metrics.maxPrice > 0 && metrics.minPrice > 0 ? ((metrics.maxPrice - metrics.minPrice) / metrics.minPrice * 100).toFixed(0) : 0}%`} color="amber" />
        <InsightCard icon={<Building2 className="h-5 w-5" />} title="Fornecedores" value={metrics.uniqueSuppliers.toString()} subtitle="Fornecedores diferentes" color="blue" />
      </div>

      <div className="my-2">
        <AiExecutiveSummaryCard data={{ itemName: packagingName, metrics, recentPrices: priceHistory }} />
      </div>

      <div className={cn(ds.components.card.root, "p-1")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className={ds.components.tabs.clean.list}>
              <TabsTrigger value="overview" className={ds.components.tabs.clean.trigger}>Histórico de Preços</TabsTrigger>
              <TabsTrigger value="suppliers" className={ds.components.tabs.clean.trigger}>Por Fornecedor</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-0 p-4">
            <PriceHistoryList history={priceHistory} />
          </TabsContent>
          <TabsContent value="suppliers" className="mt-0 p-4">
            <SupplierComparison orders={orders} quotes={quotes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SupplierPackagingAnalysis({ supplierId, supplierName, onClear }: { supplierId: string; supplierName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["supplier-packaging-quotes", supplierId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_supplier_items" as any).select("*").eq("supplier_id", supplierId).gt("valor_total", 0).order("created_at", { ascending: false }) as any);
      return data || [];
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["supplier-packaging-orders", supplierId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_orders" as any).select("*, packaging_order_items(*)").eq("supplier_id", supplierId).order("order_date", { ascending: false }) as any);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const quotesWithOrders = quotes.filter((q: any) => orders.some((o: any) => o.packaging_order_items?.some((item: any) => item.packaging_name === q.packaging_name)));
    const winRate = quotes.length > 0 ? (quotesWithOrders.length / quotes.length) * 100 : 0;
    const deliveredOrders = orders.filter((o: any) => o.status === "entregue");
    const deliveryRate = orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;
    const totalValue = orders.reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalValue / orders.length : 0;
    const packagingSet = new Set<string>();
    quotes.forEach((q: any) => q.packaging_name && packagingSet.add(q.packaging_name));
    orders.forEach((o: any) => o.packaging_order_items?.forEach((item: any) => item.packaging_name && packagingSet.add(item.packaging_name)));
    return { totalQuotes: quotes.length, wonQuotes: quotesWithOrders.length, winRate, totalOrders: orders.length, deliveredOrders: deliveredOrders.length, deliveryRate, totalValue, avgOrderValue, uniquePackaging: packagingSet.size };
  }, [quotes, orders]);

  const topPackaging = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; totalSpent: number; count: number }> = {};
    orders.forEach((o: any) => { o.packaging_order_items?.forEach((item: any) => { const name = item.packaging_name; if (!map[name]) map[name] = { name, quantity: 0, totalSpent: 0, count: 0 }; map[name].quantity += item.quantidade || 0; map[name].totalSpent += item.valor_total || 0; map[name].count += 1; }); });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  }, [orders]);

  const isLoading = quotesLoading || ordersLoading;
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className={cn(
        "flex items-center justify-between p-6 rounded-2xl shadow-xl overflow-hidden relative border border-brand/10",
        ds.colors.surface.card
      )}>
        <div className="absolute right-0 top-0 w-32 h-full bg-brand/5 skew-x-[-20deg] translate-x-16 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-brand/5 backdrop-blur-md border border-brand/10">
            <Building2 className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, ds.colors.text.primary, "tracking-tight")}>
              {supplierName}
            </h2>
            <p className="text-zinc-500 text-sm font-medium">Histórico do parceiro comercial (Embalagens)</p>
          </div>
        </div>
        <Button onClick={onClear} className={cn(ds.components.button.base, ds.components.button.variants.secondary, "relative z-10 font-bold")}>
          Fechar Análise
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FileText className="h-4 w-4" />} label="Cotações" value={`${metrics.wonQuotes}/${metrics.totalQuotes}`} subtitle={`${metrics.winRate.toFixed(0)}% vitórias`} color="blue" />
        <MetricCard icon={<ShoppingCart className="h-4 w-4" />} label="Pedidos" value={metrics.totalOrders.toString()} subtitle={`${metrics.deliveredOrders} entregues`} color="green" />
        <MetricCard icon={<DollarSign className="h-4 w-4" />} label="Total Comprado" value={formatCurrency(metrics.totalValue)} color="violet" />
        <MetricCard icon={<Target className="h-4 w-4" />} label="Ticket Médio" value={formatCurrency(metrics.avgOrderValue)} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard icon={<Award className="h-5 w-5" />} title="Taxa de Vitória" value={`${metrics.winRate.toFixed(0)}%`} subtitle={`${metrics.wonQuotes} de ${metrics.totalQuotes} cotações`} color={metrics.winRate >= 50 ? "emerald" : metrics.winRate >= 25 ? "amber" : "red"} />
        <InsightCard icon={<CheckCircle className="h-5 w-5" />} title="Taxa de Entrega" value={`${metrics.deliveryRate.toFixed(0)}%`} subtitle={`${metrics.deliveredOrders} de ${metrics.totalOrders} pedidos`} color={metrics.deliveryRate >= 80 ? "emerald" : metrics.deliveryRate >= 50 ? "amber" : "red"} />
        <InsightCard icon={<Package className="h-5 w-5" />} title="Embalagens" value={metrics.uniquePackaging.toString()} subtitle="Embalagens diferentes" color="blue" />
      </div>

      <div className="my-2">
        <AiExecutiveSummaryCard data={{ supplierName, metrics, topPackaging }} />
      </div>

      <div className={cn(ds.components.card.root, "p-1")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className={ds.components.tabs.clean.list}>
              <TabsTrigger value="overview" className={ds.components.tabs.clean.trigger}>Pedidos Recentes</TabsTrigger>
              <TabsTrigger value="packaging" className={ds.components.tabs.clean.trigger}>Embalagens Compradas</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-0 p-4">
            <OrderHistoryList orders={orders} />
          </TabsContent>
          <TabsContent value="packaging" className="mt-0 p-4">
            <TopPackagingList packaging={topPackaging} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---

export default function PackagingAnalysisTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: packagingItems = [] } = useQuery({
    queryKey: ["analysis-packaging-items"],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_items" as any).select("id, name").order("name") as any);
      return data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["analysis-packaging-suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name, contact").order("name");
      return data || [];
    },
  });

  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    const term = debouncedSearch.toLowerCase();
    const packagingResults = packagingItems
      .filter((p: any) => p.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map((p: any) => ({ type: "packaging" as SearchType, id: p.id, name: p.name, contact: null }));
    const supplierResults = suppliers
      .filter(s => s.name.toLowerCase().includes(term) || (s.contact && s.contact.toLowerCase().includes(term)))
      .slice(0, 5)
      .map(s => ({ type: "supplier" as SearchType, id: s.id, name: s.name, contact: s.contact }));
    return [...packagingResults, ...supplierResults];
  }, [debouncedSearch, packagingItems, suppliers]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1)); }
    else if (e.key === "Enter" && highlightedIndex >= 0) { e.preventDefault(); selectItem(searchResults[highlightedIndex]); }
    else if (e.key === "Escape") { setSearchTerm(""); setHighlightedIndex(-1); }
  }, [searchResults, highlightedIndex]);

  const selectItem = (item: SelectedItem) => { setSelectedItem(item); setSearchTerm(""); setHighlightedIndex(-1); };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className={cn(ds.components.card.root, "p-6 bg-brand/5 border-brand/10")}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand/10 border border-brand/20">
              <BarChart3 className="h-6 w-6 text-brand" />
            </div>
            <div className="flex-1">
              <h3 className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary)}>Análise de Embalagens</h3>
              <p className={cn(ds.typography.size.sm, ds.colors.text.secondary, "opacity-70")}>Busque por embalagem ou fornecedor para insights detalhados</p>
            </div>
          </div>
        </div>

        <div className="mt-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-brand transition-colors" />
          <Input
            placeholder="Digite o nome da embalagem ou fornecedor..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(-1); }}
            onKeyDown={handleSearchKeyDown}
            className={cn(ds.components.input.root, "pl-12 h-14 text-base rounded-2xl focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none")}
          />
          {searchResults.length > 0 && (
            <div className={cn("absolute z-50 w-full mt-3 border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200", ds.colors.surface.card, ds.colors.border.subtle)}>
              <div className="px-5 py-3 bg-muted/30 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Sugestões encontradas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {searchResults.map((item, index) => (
                  <button key={`${item.type}-${item.id}`} onClick={() => selectItem(item)} onMouseEnter={() => setHighlightedIndex(index)} className={cn("w-full px-5 py-4 flex items-center gap-4 text-left transition-all relative group", highlightedIndex === index ? "bg-brand/5" : "hover:bg-muted/30")}>
                    {highlightedIndex === index && <div className="absolute left-0 top-0 w-1 h-full bg-brand" />}
                    <div className={cn("p-2.5 rounded-xl flex-shrink-0 transition-colors", item.type === "packaging" ? (highlightedIndex === index ? "bg-brand text-white" : "bg-brand/10 text-brand") : (highlightedIndex === index ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500"))}>
                      {item.type === "packaging" ? <Package className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm truncate", ds.colors.text.primary)}>{item.name}</p>
                      <p className={cn("text-xs flex items-center gap-2", ds.colors.text.secondary, "opacity-60")}>
                        {item.type === "packaging" ? <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Embalagem</span> : <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Fornecedor</span>}
                      </p>
                    </div>
                    <ArrowRight className={cn("h-4 w-4 transition-all", highlightedIndex === index ? "translate-x-1 text-brand opacity-100" : "text-muted-foreground opacity-0")} />
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 text-[10px] font-black text-muted-foreground/50 bg-muted/30 border-t border-border flex justify-between uppercase tracking-widest">
                <div>DICA: Use as setas para navegar</div>
                <div className="flex gap-4"><span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-background rounded border border-border shadow-sm">↑↓</kbd> Mudar</span><span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 bg-background rounded border border-border shadow-sm">Enter</kbd> Abrir</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedItem ? (
        selectedItem.type === "packaging" ? <PackagingAnalysis packagingId={selectedItem.id} packagingName={selectedItem.name} onClear={() => setSelectedItem(null)} /> : <SupplierPackagingAnalysis supplierId={selectedItem.id} supplierName={selectedItem.name} onClear={() => setSelectedItem(null)} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
