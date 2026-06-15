import { useState, useEffect, useRef, useCallback } from "react";
import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Loader2, Package, Save, ShoppingCart, X, Search,
  Download, DollarSign, Calculator, ArrowLeftRight, ChevronDown, CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
  marca?: string;
  // Preços de negociação (só preenchidos quando o pedido veio de cotação)
  valorUnitarioCotado?: number | null; // preço final negociado
  maiorValorCotado?: number | null;    // preço inicial do fornecedor (antes da negociação)
}

interface PedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit?: () => void;
}

export default function PedidoDialog({ open, onOpenChange, pedido, onEdit }: PedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Form state
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const isReadOnly = pedido?.status === "entregue";

  const selectedDate = dataEntrega
    ? (() => { try { const d = parseISO(dataEntrega); return isValid(d) ? d : undefined; } catch { return undefined; } })()
    : undefined;

  const handleDateSelect = (day: Date | undefined) => {
    setDataEntrega(day ? format(day, "yyyy-MM-dd") : "");
    setDateOpen(false);
  };

  // Add item form
  const [newProduct, setNewProduct] = useState<any>(null);
  const [newProductSearch, setNewProductSearch] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedSearch = useDebounce(newProductSearch, 300);

  const newProductInputRef = useRef<HTMLInputElement>(null);
  const newQuantityInputRef = useRef<HTMLInputElement>(null);
  const newPriceInputRef = useRef<HTMLInputElement>(null);

  // Conversion tool
  const [showConversion, setShowConversion] = useState(false);
  const [conversionMode, setConversionMode] = useState<"box_to_unit" | "unit_to_box">("box_to_unit");
  const [unPerBox, setUnPerBox] = useState("");

  // Calculator
  const [showCalc, setShowCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcExpr, setCalcExpr] = useState("");
  const calcRef = useRef({ prevVal: null as number | null, op: null as string | null, waitNew: false });

  // Data
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Swipe-to-delete (mobile)
  const [swipableItemId, setSwipableItemId] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartRef = useRef<number | null>(null);

  const calculateTotal = () =>
    itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    swipeStartRef.current = e.touches[0].clientX;
    setSwipableItemId(index);
    setSwipeOffset(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartRef.current === null) return;
    const diff = e.touches[0].clientX - swipeStartRef.current;
    setSwipeOffset(diff < 0 ? Math.max(diff, -80) : 0);
  };
  const handleTouchEnd = (index: number) => {
    if (swipeOffset < -50 && !isReadOnly) setItens(itens.filter((_, i) => i !== index));
    swipeStartRef.current = null;
    setSwipableItemId(null);
    setSwipeOffset(0);
  };

  const statusOptions = [
    { value: "pendente",    label: "Pendente",    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
    { value: "processando", label: "Processando", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
    { value: "confirmado",  label: "Confirmado",  color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
    { value: "entregue",    label: "Entregue",    color: "bg-brand/10 text-brand border-brand/30" },
    { value: "cancelado",   label: "Cancelado",   color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  ];

  useEffect(() => {
    if (open) loadSuppliers();
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "pendente");
      setObservacoes(pedido.observations || pedido.observacoes || "");
      if (pedido.detalhesItens?.length > 0) {
        setItens(
          pedido.detalhesItens.map((item: any) => ({
            produto: item.product_name || item.produto || "",
            quantidade: parseFloat(item.quantity || item.quantidade || 1),
            valorUnitario: parseFloat(item.unit_price || item.valorUnitario || 0),
            unidade: item.unit || item.unidade || "un",
            marca: item.brand_name || item.marca || "",
            valorUnitarioCotado: item.valorUnitarioCotado ?? item.valor_unitario_cotado ?? null,
            maiorValorCotado: item.maiorValorCotado ?? item.maior_valor_cotado ?? null,
          }))
        );
      } else {
        setItens([]);
      }
    }
  }, [pedido, open]);

  const loadSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").order("name");
    setSuppliers(data || []);
  };

  const searchProducts = async (term: string) => {
    if (!term || term.trim().length < 3) { setProducts([]); setShowProductSuggestions(false); return; }
    setIsSearchingProducts(true);
    try {
      const { data } = await supabase
        .from("products").select("id, name, unit").ilike("name", `%${term}%`).order("name").limit(20);
      setProducts(data || []);
      if ((data || []).length > 0) setShowProductSuggestions(true);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch && debouncedSearch.trim().length >= 3) searchProducts(debouncedSearch);
    else { setProducts([]); setShowProductSuggestions(false); }
  }, [debouncedSearch]);

  const handleAddNewItem = () => {
    const productName = newProduct ? newProduct.name : newProductSearch;
    if (!productName) return;
    setItens([
      { produto: productName, quantidade: parseFloat(newQuantity) || 1,
        valorUnitario: parseFloat(String(newPrice).replace(",", ".")) || 0,
        unidade: newProductUnit, marca: newProduct?.brand_name || "" },
      ...itens,
    ]);
    setNewProduct(null); setNewProductSearch(""); setNewQuantity(""); setNewPrice("");
    setTimeout(() => newProductInputRef.current?.focus(), 50);
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent, field: "search" | "quantity" | "price") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "search") {
        if (products.length > 0 && highlightedIndex >= 0) {
          const p = products[highlightedIndex];
          setNewProduct(p); setNewProductSearch(p.name); setHighlightedIndex(-1);
          newQuantityInputRef.current?.focus();
        } else if (newProductSearch) newQuantityInputRef.current?.focus();
      } else if (field === "quantity") newPriceInputRef.current?.focus();
      else if (field === "price") handleAddNewItem();
    } else if (e.key === "ArrowDown" && field === "search") {
      e.preventDefault(); setHighlightedIndex(p => Math.min(p + 1, products.length - 1));
    } else if (e.key === "ArrowUp" && field === "search") {
      e.preventDefault(); setHighlightedIndex(p => Math.max(p - 1, -1));
    }
  };

  // ── Calculator ────────────────────────────────────────────────────────────
  const calcComputeFn = (a: number, b: number, op: string) => {
    const r = op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : b !== 0 ? a / b : 0;
    return Math.round(r * 1e10) / 1e10;
  };

  const handleCalcKey = useCallback((key: string) => {
    const cs = calcRef.current;
    if (key === "C") {
      setCalcDisplay("0"); setCalcExpr(""); calcRef.current = { prevVal: null, op: null, waitNew: false }; return;
    }
    if (key === "⌫") { setCalcDisplay(d => d.length > 1 ? d.slice(0, -1) : "0"); return; }
    if ("0123456789.".includes(key)) {
      setCalcDisplay(d => {
        if (cs.waitNew) { cs.waitNew = false; return key === "." ? "0." : key; }
        if (key === "." && d.includes(".")) return d;
        return d === "0" && key !== "." ? key : d + key;
      }); return;
    }
    const opMap: Record<string, string> = { "×": "*", "÷": "/", "+": "+", "-": "-" };
    if (opMap[key]) {
      setCalcDisplay(d => {
        const val = parseFloat(d);
        if (cs.prevVal !== null && cs.op && !cs.waitNew) {
          const res = calcComputeFn(cs.prevVal, val, cs.op);
          const s = Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/, "") || "0";
          cs.prevVal = res; setCalcExpr(`${s} ${key}`); cs.op = opMap[key]; cs.waitNew = true; return s;
        }
        cs.prevVal = val; setCalcExpr(`${val} ${key}`); cs.op = opMap[key]; cs.waitNew = true; return d;
      }); return;
    }
    if (key === "=") {
      if (cs.prevVal === null || !cs.op) return;
      setCalcDisplay(d => {
        const res = calcComputeFn(cs.prevVal!, parseFloat(d), cs.op!);
        const s = Number.isInteger(res) ? String(res) : res.toFixed(8).replace(/\.?0+$/, "") || "0";
        cs.prevVal = null; cs.op = null; cs.waitNew = true; setCalcExpr(""); return s;
      });
    }
  }, []);

  useEffect(() => {
    if (!showCalc) return;
    const kmap: Record<string, string> = {
      "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
      ".":".", ",":".", "+":"+", "-":"-", "*":"×", "/":"÷", Enter:"=", "=":"=",
    };
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const mapped = kmap[e.key];
      if (mapped) { e.preventDefault(); handleCalcKey(mapped); }
      else if (e.key === "Backspace") { e.preventDefault(); handleCalcKey("⌫"); }
      else if (e.key === "Delete") { e.preventDefault(); handleCalcKey("C"); }
      else if (e.key === "Escape") setShowCalc(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showCalc, handleCalcKey]);

  // ── Conversion ────────────────────────────────────────────────────────────
  const conversionResult = (() => {
    const price = parseFloat(String(newPrice).replace(",", ".")) || 0;
    const factor = parseFloat(unPerBox.replace(",", ".")) || 0;
    if (!price || !factor) return null;
    return conversionMode === "box_to_unit"
      ? { label: "Preço por unidade", value: price / factor }
      : { label: "Preço por caixa", value: price * factor };
  })();

  const handleApplyConversion = () => {
    if (!conversionResult) return;
    setNewPrice(conversionResult.value.toFixed(4).replace(/\.?0+$/, ""));
    setNewProductUnit(conversionMode === "box_to_unit" ? "un" : "cx");
    setShowConversion(false);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user || !fornecedor || !dataEntrega) {
      toast({ title: "Erro", description: "Preencha fornecedor e data de entrega", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);
      await supabase.from("orders").update({
        supplier_id: fornecedor, supplier_name: selectedSupplier?.name || "",
        total_value: total, status, delivery_date: dataEntrega, observations: observacoes,
      }).eq("id", pedido.id);
      await supabase.from("order_items").delete().eq("order_id", pedido.id);
      const orderItems = itens.filter(i => i.produto).map(item => {
        const product = products.find(p => p.name === item.produto);
        return { order_id: pedido.id, product_id: product?.id || null, product_name: item.produto,
          quantity: item.quantidade, unit: item.unidade, unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario };
      });
      if (orderItems.length > 0) await supabase.from("order_items").insert(orderItems);
      toast({ title: "Pedido atualizado com sucesso!" });
      if (onEdit) onEdit();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHtml = useCallback(() => {
    if (!pedido || itens.length === 0) return;
    const total = calculateTotal();
    const selectedSupplier = suppliers.find(s => s.id === fornecedor);
    const statusLabel = statusOptions.find(o => o.value === (status || pedido?.status))?.label || "-";
    const now = new Date();
    const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d: string) => {
      if (!d) return "-"; if (d.includes("/")) return d;
      try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
    };
    const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
    const brand = ds.colors.brand.primary;
    const brandHover = ds.colors.brand.hover;

    // Origem: pedido criado a partir de uma cotação tem desconto negociado
    // (diferença entre o preço inicial ofertado e o valor final negociado).
    // Pedido direto não passou por negociação.
    const isFromQuote = !!pedido?.quote_id;
    let totalInicial = 0;
    let economiaNeg = 0;
    const itemRows = itens.map((item, idx) => {
      const neg = item.valorUnitarioCotado ?? item.valorUnitario;       // valor negociado/unit.
      const ini = item.maiorValorCotado ?? neg;                          // valor inicial ofertado
      const descUnit = Math.max(0, ini - neg);
      const sub = item.quantidade * item.valorUnitario;
      totalInicial += ini * item.quantidade;
      economiaNeg += descUnit * item.quantidade;
      const nome = `${idx + 1}. ${esc(item.produto)}${item.marca ? `<small>Marca: ${esc(item.marca)}</small>` : ""}`;
      const qtd = `${item.quantidade} ${esc(item.unidade)}`;
      if (isFromQuote) {
        const descItem = descUnit * item.quantidade;
        const descPct = ini > 0 ? (descUnit / ini) * 100 : 0;
        const descCell = descItem > 0
          ? `<span class="desc">- R$ ${fmt(descItem)}</span><small>${descPct.toFixed(1)}%</small>`
          : `<span class="muted">—</span>`;
        return `<tr><td>${nome}</td><td style="text-align:center">${qtd}</td><td style="text-align:right">R$ ${fmt(ini)}</td><td style="text-align:right">R$ ${fmt(neg)}</td><td style="text-align:right">${descCell}</td><td style="text-align:right"><strong>R$ ${fmt(sub)}</strong></td></tr>`;
      }
      return `<tr><td>${nome}</td><td style="text-align:center">${qtd}</td><td style="text-align:right">R$ ${fmt(item.valorUnitario)}</td><td style="text-align:right"><strong>R$ ${fmt(sub)}</strong></td></tr>`;
    }).join("");
    const economiaPct = totalInicial > 0 ? (economiaNeg / totalInicial) * 100 : 0;

    const tableHead = isFromQuote
      ? `<th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Pç. Inicial</th><th style="text-align:right">Pç. Negoc.</th><th style="text-align:right">Desconto</th><th style="text-align:right">Subtotal</th>`
      : `<th>Produto</th><th style="text-align:center">Qtd</th><th style="text-align:right">Valor Unit.</th><th style="text-align:right">Subtotal</th>`;
    const totalColspan = isFromQuote ? 5 : 3;
    const totalRow = `<tr class="total-row"><td colspan="${totalColspan}" style="text-align:right">TOTAL DO PEDIDO</td><td style="text-align:right">R$ ${fmt(total)}</td></tr>`;

    const economiaBlock = isFromQuote ? `
  <div class="economia">
    <div>
      <strong>Economia na negociação</strong>
      <p>Diferença entre o preço inicial ofertado e o valor final negociado.</p>
    </div>
    <div class="economia-value">
      <span>R$ ${fmt(economiaNeg)}</span>
      <small>${economiaPct.toFixed(1)}% sobre R$ ${fmt(totalInicial)}</small>
    </div>
  </div>` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pedido #${pedido.id.substring(0, 8)} - ${esc(selectedSupplier?.name || "")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; color: #18181b; padding: 20px; line-height: 1.5; }
  .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  .header { background: linear-gradient(135deg, ${brand} 0%, ${brandHover} 100%); color: #18181b; padding: 30px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
  .header h1 { font-size: 24px; font-weight: 800; letter-spacing: .5px; }
  .header p { font-size: 13px; font-weight: 600; opacity: .85; margin-top: 4px; }
  .badge { display: inline-block; margin-top: 12px; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; background: rgba(0,0,0,.12); }
  .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px; }
  .info-card { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid ${brand}; }
  .info-card strong { display: block; color: ${brand}; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; margin-bottom: 4px; }
  .info-card span { font-size: 15px; font-weight: 600; word-break: break-word; }
  .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; min-width: ${isFromQuote ? "640px" : "520px"}; }
  th { background: #f9fafb; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 800; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  td small { display: block; color: #9ca3af; font-size: 11px; margin-top: 2px; }
  td .desc { color: #b91c1c; font-weight: 700; }
  td .muted { color: #d1d5db; }
  .total-row { background: #dcfce7 !important; font-weight: 800; }
  .total-row td { color: #166534; font-size: 16px; }
  .economia { margin-top: 24px; padding: 20px 24px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  .economia strong { display: block; color: #065f46; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; }
  .economia p { color: #047857; font-size: 12px; margin-top: 4px; }
  .economia-value { text-align: right; white-space: nowrap; }
  .economia-value span { display: block; font-size: 24px; font-weight: 900; color: #059669; }
  .economia-value small { color: #047857; font-size: 12px; font-weight: 600; }
  .obs { background: #fff7ed; padding: 20px; border-radius: 8px; border-left: 4px solid ${brand}; margin-top: 24px; }
  .obs strong { display: block; color: ${brand}; font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: .5px; margin-bottom: 6px; }
  .obs p { white-space: pre-wrap; font-size: 14px; }
  .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media (max-width: 640px) {
    body { padding: 0; }
    .container { padding: 20px; border-radius: 0; }
    .header { padding: 20px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; }
    .info-grid { grid-template-columns: 1fr; gap: 10px; }
    .economia { flex-direction: column; align-items: flex-start; }
    .economia-value { text-align: left; }
  }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; max-width: 100%; padding: 0; }
    .table-wrap { overflow: visible; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>PEDIDO #${pedido.id.substring(0, 8)}</h1>
    <p>${esc(selectedSupplier?.name || "Fornecedor não informado")}</p>
    <span class="badge">${isFromQuote ? "Originado de cotação" : "Pedido direto"}</span>
  </div>
  <div class="info-grid">
    <div class="info-card"><strong>Fornecedor</strong><span>${esc(selectedSupplier?.name || "-")}</span></div>
    <div class="info-card"><strong>Entrega</strong><span>${fmtDate(dataEntrega)}</span></div>
    <div class="info-card"><strong>Status</strong><span>${esc(statusLabel)}</span></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>
        ${itemRows}
        ${totalRow}
      </tbody>
    </table>
  </div>
  ${economiaBlock}
  ${observacoes ? `<div class="obs"><strong>Observações</strong><p>${esc(observacoes)}</p></div>` : ""}
  <div class="footer">Sistema CotaJá &bull; Pedido de Compra &bull; Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
</div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pedido-${pedido.id.substring(0,8)}-${new Date().toISOString().split("T")[0]}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: "Pedido exportado!" });
  }, [pedido, itens, fornecedor, dataEntrega, observacoes, status, suppliers, toast]);

  const currentStatusOption = statusOptions.find(o => o.value === (status || pedido?.status)) || statusOptions[0];

  // ── Shared form body ──────────────────────────────────────────────────────
  const formBody = (
    <div className="space-y-6">
      {/* Section: Dados do Pedido */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Dados do Pedido</p>
        <div className="grid grid-cols-2 gap-4">
          <div className={ds.components.input.group}>
            <Label className={ds.components.input.label}>Fornecedor</Label>
            <Select value={fornecedor} onValueChange={setFornecedor} disabled={isReadOnly}>
              <SelectTrigger className={cn(ds.components.input.root, "h-10")}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id} className="font-bold">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={ds.components.input.group}>
            <Label className={ds.components.input.label}>Data de Entrega</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  disabled={isReadOnly}
                  className={cn(
                    ds.components.input.root,
                    "h-10 w-full flex items-center gap-2 px-3 text-sm font-medium text-left transition-colors",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className={ds.components.input.group}>
            <Label className={ds.components.input.label}>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={isReadOnly}>
              <SelectTrigger className={cn(ds.components.input.root, "h-10")}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={ds.components.input.group}>
            <Label className={ds.components.input.label}>Observações</Label>
            <Textarea placeholder="Observações..." value={observacoes} onChange={e => setObservacoes(e.target.value)}
              disabled={isReadOnly} rows={1}
              className={cn(ds.components.input.root, "min-h-[40px] resize-none")} />
          </div>
        </div>
      </div>

      {/* Section: Itens */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Itens</p>
          <Badge className={cn(ds.components.badge.base, "bg-brand/10 text-brand border-brand/20 text-[10px] px-2.5 py-0.5")}>
            {itens.length} {itens.length === 1 ? "item" : "itens"}
          </Badge>
        </div>

        {!isReadOnly && (
          <div className="space-y-3 p-4 rounded-xl border border-brand/20 bg-brand/5 mb-4">
            {/* Add item row */}
            <div className="space-y-2 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
              <div className="relative w-full sm:flex-1 sm:min-w-0 overflow-visible">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  ref={newProductInputRef}
                  placeholder="Produto..."
                  value={newProductSearch}
                  onChange={e => { setNewProductSearch(e.target.value); setNewProduct(null); }}
                  onKeyDown={e => handleNewItemKeyDown(e, "search")}
                  onFocus={() => { if (newProductSearch.trim().length >= 3) setShowProductSuggestions(true); }}
                  className={cn(ds.components.input.root, "pl-9 h-9 text-sm bg-background/50")}
                />
                {showProductSuggestions && products.length > 0 && !newProduct && (
                  <div className={cn(
                    "absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-y-auto rounded-xl shadow-2xl z-[200] border",
                    ds.colors.surface.card, ds.colors.border.default
                  )}>
                    {products.map((p, idx) => (
                      <button key={p.id}
                        onClick={() => {
                          setNewProduct(p); setNewProductSearch(p.name);
                          setNewProductUnit(p.unit || "un"); setProducts([]);
                          setShowProductSuggestions(false); newQuantityInputRef.current?.focus();
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 text-left flex items-center gap-2 border-b last:border-none transition-colors",
                          highlightedIndex === idx ? "bg-brand/10 text-brand" : ds.colors.surface.hover,
                          ds.colors.border.default
                        )}
                      >
                        <span className="text-sm font-bold truncate">{p.name}</span>
                        <span className="text-xs text-zinc-400 ml-auto shrink-0">{p.unit || "un"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input ref={newQuantityInputRef} type="number" placeholder="Qtd" value={newQuantity}
                  onChange={e => setNewQuantity(e.target.value)} onKeyDown={e => handleNewItemKeyDown(e, "quantity")}
                  className={cn(ds.components.input.root, "h-9 text-center w-20 shrink-0")} />

                <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                  <SelectTrigger className={cn(ds.components.input.root, "h-9 w-[72px] shrink-0")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["un","kg","pct","cx","g","l","ml","metade"].map(u => (
                      <SelectItem key={u} value={u} className="font-bold uppercase">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">R$</span>
                  <Input ref={newPriceInputRef} placeholder="Preço" value={newPrice}
                    onChange={e => setNewPrice(e.target.value)} onKeyDown={e => handleNewItemKeyDown(e, "price")}
                    className={cn(ds.components.input.root, "h-9 pl-7 text-center w-28 font-bold")} />
                </div>

                <Button onClick={handleAddNewItem} className={cn(ds.components.button.primary, "h-9 px-3 shrink-0")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tool toggles */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowConversion(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all",
                  showConversion
                    ? "bg-brand/10 text-brand border-brand/30"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:text-brand"
                )}>
                <ArrowLeftRight className="h-3 w-3" />Conversão
                <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", showConversion && "rotate-180")} />
              </button>
              <button type="button" onClick={() => setShowCalc(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all",
                  showCalc
                    ? "bg-brand text-zinc-950 border-brand"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:text-brand"
                )}>
                <Calculator className="h-3 w-3" />Calculadora
              </button>
            </div>

            {/* Conversion panel */}
            {showConversion && (
              <div className="p-3 rounded-xl border border-dashed border-brand/40 bg-white/40 dark:bg-black/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  {(["box_to_unit", "unit_to_box"] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setConversionMode(mode)}
                      className={cn(
                        "flex-1 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all",
                        conversionMode === mode ? "bg-white dark:bg-zinc-700 shadow text-brand" : "text-zinc-400"
                      )}>
                      {mode === "box_to_unit" ? "Cx → Un" : "Un → Cx"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Unidades por Caixa</Label>
                    <Input type="number" placeholder="Ex: 12" value={unPerBox} onChange={e => setUnPerBox(e.target.value)}
                      className={cn(ds.components.input.root, "h-9 text-center font-bold")} />
                  </div>
                  {conversionResult && (
                    <div className="flex-1 text-right">
                      <p className="text-[10px] font-black uppercase text-zinc-400 mb-1">{conversionResult.label}</p>
                      <p className="text-lg font-black text-brand">R$ {conversionResult.value.toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <Button onClick={handleApplyConversion} disabled={!conversionResult}
                  className={cn(ds.components.button.primary, "w-full h-9 text-xs")}>
                  Aplicar Conversão
                </Button>
              </div>
            )}

            {/* Calculator panel */}
            {showCalc && (
              <div className={cn(
                "rounded-xl border shadow-xl p-4 space-y-3 select-none animate-in fade-in zoom-in-95",
                ds.colors.surface.card, ds.colors.border.default
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Calculadora Ativa</span>
                  </div>
                  <button onClick={() => setShowCalc(false)} className="text-zinc-400 hover:text-red-500 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="rounded-xl bg-zinc-950 px-4 py-3 text-right min-h-[60px] flex flex-col justify-center shadow-inner">
                  {calcExpr && <p className="text-[10px] text-zinc-500 font-mono">{calcExpr}</p>}
                  <p className="text-2xl font-black text-brand font-mono">{calcDisplay}</p>
                </div>
                <div className="grid gap-2">
                  {(
                    [["C","⌫","÷","×"],["7","8","9","-"],["4","5","6","+"],["1","2","3","="],["0",".","Aplicar"]] as string[][]
                  ).map((row, ri) => (
                    <div key={ri} className="grid gap-2"
                      style={{ gridTemplateColumns: ri === 4 ? "1fr 1fr 2fr" : "repeat(4, 1fr)" }}>
                      {row.map(k => {
                        const isOp = ["+","-","×","÷"].includes(k);
                        const isEq = k === "=";
                        const isAct = k === "C" || k === "⌫";
                        const isApply = k === "Aplicar";
                        return (
                          <button key={k} type="button"
                            onClick={() => { if (isApply) { setNewPrice(calcDisplay); setShowCalc(false); } else handleCalcKey(k); }}
                            className={cn(
                              "rounded-lg py-2.5 text-sm font-bold transition-all active:scale-90",
                              isEq && "bg-brand text-zinc-950 shadow-lg shadow-brand/20",
                              isOp && !isEq && "bg-zinc-800 text-brand hover:bg-brand hover:text-zinc-950",
                              isAct && "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white",
                              isApply && "bg-emerald-500/10 text-emerald-600 font-black text-xs hover:bg-emerald-500 hover:text-white",
                              !isOp && !isEq && !isAct && !isApply && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-brand/20 hover:text-brand"
                            )}>
                            {k}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <kbd className="px-1.5 py-0.5 rounded border bg-zinc-50 dark:bg-zinc-800">Esc</kbd> fechar
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <kbd className="px-1.5 py-0.5 rounded border bg-zinc-50 dark:bg-zinc-800">Enter</kbd> calcular
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items list */}
        <div className="space-y-2">
          {itens.map((item, index) => (
            <div key={index} className="relative rounded-xl overflow-hidden"
              onTouchStart={e => handleTouchStart(e, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(index)}>
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-end pr-4 pointer-events-none">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 border rounded-xl group transition-colors",
                  ds.colors.surface.card, ds.colors.border.default,
                  "border-l-2", item.valorUnitario > 0 ? "border-l-brand" : "border-l-zinc-300 dark:border-l-zinc-700",
                  swipableItemId === index ? "" : "duration-200"
                )}
                style={{ transform: swipableItemId === index ? `translateX(${swipeOffset}px)` : "translateX(0)" }}>
                <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{item.produto}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantidade} {item.unidade} × R$ {item.valorUnitario.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground whitespace-nowrap">
                  R$ {(item.quantidade * item.valorUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon"
                    onClick={() => setItens(itens.filter((_, i) => i !== index))}
                    className={cn(ds.components.button.danger, "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {itens.length === 0 && (
            <div className="py-10 text-center border border-dashed rounded-xl border-border dark:border-white/5">
              <Package className="h-7 w-7 text-zinc-400 mx-auto mb-2 opacity-40" />
              <p className="text-sm text-zinc-500">Nenhum item adicionado</p>
            </div>
          )}
        </div>

        {/* Total */}
        {itens.length > 0 && (
          <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl bg-brand/5 border border-brand/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-brand" />
              <span className="text-xs font-black uppercase tracking-widest text-brand">Total</span>
            </div>
            <p className="text-base font-black text-brand">
              R$ {calculateTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Mobile: Drawer ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("h-[96dvh] max-h-[96dvh] flex flex-col p-0", ds.colors.surface.page)}>
          <div className={cn("flex-shrink-0 px-4 py-4 border-b flex items-center gap-3", ds.colors.border.default)}>
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
              <ShoppingCart className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-sm font-bold leading-none text-foreground">
                Pedido #{pedido?.id?.substring(0, 8)}
              </DrawerTitle>
              <DrawerDescription className="sr-only">Editar pedido</DrawerDescription>
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider mt-1", currentStatusOption.color)}>
                {currentStatusOption.label}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDownloadHtml}
              className={cn(ds.components.button.ghost, "h-8 w-8 text-brand")}>
              <Download className="h-4 w-4" />
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className={cn(ds.components.button.ghost, "h-8 w-8")}>
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">{formBody}</div>

          <div className={cn("flex-shrink-0 p-4 border-t flex items-center gap-3", ds.colors.border.default)}>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}
              className={cn(ds.components.button.secondary, "flex-1")}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || isReadOnly}
              className={cn(ds.components.button.primary, "flex-1 gap-2")}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: Dialog ───────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className={cn(
        "p-0 gap-0 flex flex-col overflow-hidden border shadow-xl",
        ds.colors.surface.page, ds.colors.border.default,
        "w-[95vw] max-w-[680px] max-h-[90vh] rounded-2xl"
      )}>
        <div className={cn(
          "flex-shrink-0 px-6 py-4 border-b flex items-center gap-3",
          ds.colors.surface.section, ds.colors.border.default
        )}>
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <ShoppingCart className="h-4 w-4 text-zinc-950 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-bold leading-none text-foreground">
              Pedido #{pedido?.id?.substring(0, 8)}
            </DialogTitle>
            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider mt-1.5", currentStatusOption.color)}>
              {currentStatusOption.label}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDownloadHtml} title="Exportar pedido"
            className={cn(ds.components.button.ghost, "h-8 w-8 text-brand hover:bg-brand/10")}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">{formBody}</div>

        <div className={cn(
          "flex-shrink-0 px-6 py-4 border-t flex items-center justify-between",
          ds.colors.surface.section, ds.colors.border.default
        )}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}
            className={cn(ds.components.button.secondary, "gap-2")}>
            <X className="h-4 w-4" />Fechar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || isReadOnly}
            className={cn(ds.components.button.primary, "gap-2")}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
