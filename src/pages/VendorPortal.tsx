import { useState, useEffect, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, CheckCircle2, AlertCircle, Send, ShieldCheck, Box,
  ChevronDown, ChevronUp, Scale, Hash, Info, RefreshCw, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendWhatsApp } from "@/lib/whatsapp-service";

interface HistoryVariant {
  quantidade_venda: number;
  quantidade_unidades_estimada: number;
  unidade_venda: string;
  gramatura: number | null;
  dimensoes: string | null;
  valor_total: number;
}

interface QuoteItem {
  product_id: string;
  product_name: string;
  quantidade: number;
  unidade: string;
  valor_oferecido: string | number | null;
  observacoes: string | null;
  quantidade_por_caixa: string;
  _token?: string;
  _quote_id?: string;
  is_packaging?: boolean;
  quantidade_venda?: number | string | null;
  quantidade_unidades_estimada?: number | string | null;
  unidade_venda?: string | null;
  gramatura?: number | string | null;
  dimensoes?: string | null;
  last_spec?: HistoryVariant | null;
  history_variants?: HistoryVariant[];
  _spec_confirmed?: boolean;
  _spec_expanded?: boolean;
}

interface QuoteData {
  quote_id: string;
  supplier_id: string;
  status: string;
  supplier_name: string;
  company_id: string;
  items: QuoteItem[];
  deadline?: string;
  created_at?: string;
  is_packaging?: boolean;
}

function parseTokensDefensively(token: string | undefined): string[] {
  if (!token) return [];
  let decodedToken = token;
  try { decodedToken = decodeURIComponent(token); } catch (e) {}
  decodedToken = decodedToken.replace(/%2C/gi, ',');
  return decodedToken.split(',').map(t => t.trim()).filter(Boolean);
}

function formatInputToBRL(value: string): string {
  const digitOnly = value.replace(/\D/g, "");
  if (!digitOnly) return "";
  const numericValue = parseInt(digitOnly, 10) / 100;
  return numericValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface VendorItemProps {
  item: QuoteItem;
  index: number;
  onPriceChange: (productId: string, token: string | undefined, value: string) => void;
  onObsChange: (productId: string, token: string | undefined, value: string) => void;
  onBoxQtyChange: (productId: string, token: string | undefined, value: string) => void;
  onUpdateField: (productId: string, token: string | undefined, field: string, value: any) => void;
  onToggleSpec: (productId: string, token: string | undefined) => void;
  onConfirmSpec: (productId: string, token: string | undefined, confirmed: boolean) => void;
  onApplyVariant: (productId: string, token: string | undefined, variant: HistoryVariant) => void;
}

const VendorItem = memo(function VendorItem({
  item, index,
  onPriceChange, onObsChange, onBoxQtyChange, onUpdateField,
  onToggleSpec, onConfirmSpec, onApplyVariant,
}: VendorItemProps) {
  const isPkg = !!item.is_packaging;
  const hasHistory = isPkg && !!item.last_spec;
  const variants = (item.history_variants || []) as HistoryVariant[];
  const isExpanded = item._spec_expanded;
  const specConfirmed = item._spec_confirmed;

  const pkgPrice = item.valor_oferecido ? parseFloat(String(item.valor_oferecido).replace(/\./g, '').replace(',', '.')) : 0;
  const pkgUnits = item.quantidade_unidades_estimada ? parseInt(String(item.quantidade_unidades_estimada), 10) : 0;
  const costPerUnit = pkgPrice > 0 && pkgUnits > 0 ? pkgPrice / pkgUnits : null;

  const hasFilled = (() => {
    const val = item.valor_oferecido?.toString().replace(",", ".");
    return !!(val && Number(val) > 0);
  })();

  return (
    <div
      key={`${item.product_id}-${item._token}`}
      className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
    >
      {/* Left accent border by fill state */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-500",
        hasFilled ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700/60"
      )} />

      {/* Cabeçalho do item */}
      <div className="pl-5 pr-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              {isPkg && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                  Embalagem
                </span>
              )}
            </div>
            <h3 className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
              {item.product_name}
            </h3>
            <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
              {item.quantidade} {item.unidade}
            </p>
          </div>
          {hasFilled && (
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-emerald-500/30 animate-in zoom-in-75 duration-200">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          {/* Preço */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-300 dark:text-zinc-600 pointer-events-none select-none">R$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={isPkg ? "Preço do fardo/pacote" : item.unidade?.toUpperCase().startsWith('CX') ? "Preço do kg ou unidade" : "Preço unitário"}
              className="w-full pl-10 pr-4 h-12 rounded-xl text-[15px] font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-all"
              value={item.valor_oferecido || ""}
              onChange={(e) => onPriceChange(item.product_id, item._token, e.target.value)}
            />
          </div>

          {/* Qtd por caixa (apenas para CX) */}
          {!isPkg && item.unidade?.toUpperCase().startsWith('CX') && (
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-1 mb-1.5">
                Informe o valor do quilo ou da unidade
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 pointer-events-none">QTD/CX</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Unidades por caixa (opcional)"
                  className="w-full pl-16 pr-4 h-10 rounded-xl text-xs font-bold bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/30 focus:bg-white dark:focus:bg-zinc-800 focus:border-amber-500 outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 transition-all"
                  value={item.quantidade_por_caixa || ""}
                  onChange={(e) => onBoxQtyChange(item.product_id, item._token, e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Observações */}
          <input
            placeholder="Observação / Marca (opcional)"
            className="w-full h-10 px-4 rounded-xl text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-300 dark:focus:border-white/10 outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 transition-all"
            value={item.observacoes || ""}
            onChange={(e) => onObsChange(item.product_id, item._token, e.target.value)}
          />
        </div>
      </div>

      {/* Seção embalagem */}
      {isPkg && (
        <div className="border-t border-zinc-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => onToggleSpec(item.product_id, item._token)}
            className="w-full flex items-center justify-between pl-5 pr-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="h-3 w-3" />
              Detalhes da embalagem
              <span className="text-zinc-400 font-medium normal-case tracking-normal">(recomendado)</span>
            </span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />}
          </button>

          {isExpanded && (
            <div className="pl-5 pr-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {hasHistory && specConfirmed === undefined && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Dados da última cotação</p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Peso: {item.last_spec?.quantidade_venda || '—'}{item.last_spec?.unidade_venda || 'kg'} · {item.last_spec?.quantidade_unidades_estimada || '—'} unidades
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onConfirmSpec(item.product_id, item._token, true)}
                      className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider rounded-xl bg-emerald-500 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <CheckCircle2 className="h-3 w-3" /> Continua igual
                    </button>
                    <button type="button" onClick={() => onConfirmSpec(item.product_id, item._token, false)}
                      className="flex-1 h-9 text-[10px] font-black uppercase tracking-wider rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <RefreshCw className="h-3 w-3" /> Mudou
                    </button>
                  </div>
                </div>
              )}

              {specConfirmed === false && variants.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Valores anteriores:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variants.map((v, vi) => (
                      <button key={vi} type="button" onClick={() => onApplyVariant(item.product_id, item._token, v)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-100 transition-colors active:scale-95">
                        {v.quantidade_venda}{v.unidade_venda} · {v.quantidade_unidades_estimada}un
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(specConfirmed !== true || !hasHistory) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Scale className="h-2.5 w-2.5" /> Peso (kg)</label>
                    <input type="text" inputMode="decimal" placeholder="Ex: 2.5"
                      className="w-full h-10 px-3 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:border-blue-500 outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 transition-all"
                      value={item.quantidade_venda || ''}
                      onChange={(e) => onUpdateField(item.product_id, item._token, 'quantidade_venda', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Hash className="h-2.5 w-2.5" /> Qtd Unidades</label>
                    <input type="text" inputMode="numeric" placeholder="Ex: 800"
                      className="w-full h-10 px-3 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:border-blue-500 outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 transition-all"
                      value={item.quantidade_unidades_estimada || ''}
                      onChange={(e) => onUpdateField(item.product_id, item._token, 'quantidade_unidades_estimada', e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Vende como</label>
                    <select className="w-full h-10 px-3 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:border-blue-500 outline-none text-zinc-900 dark:text-zinc-50 appearance-none"
                      value={item.unidade_venda || 'kg'}
                      onChange={(e) => onUpdateField(item.product_id, item._token, 'unidade_venda', e.target.value)}>
                      <option value="kg">KG</option>
                      <option value="un">Unidade</option>
                      <option value="fardo">Fardo</option>
                      <option value="pacote">Pacote</option>
                      <option value="bobina">Bobina</option>
                      <option value="rolo">Rolo</option>
                      <option value="caixa">Caixa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Espessura (mm)</label>
                    <input type="text" inputMode="decimal" placeholder="Ex: 0.08"
                      className="w-full h-10 px-3 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 focus:border-blue-500 outline-none text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 transition-all"
                      value={item.gramatura || ''}
                      onChange={(e) => onUpdateField(item.product_id, item._token, 'gramatura', e.target.value)} />
                  </div>
                </div>
              )}

              {specConfirmed === true && hasHistory && (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {item.quantidade_venda}{item.unidade_venda} · {item.quantidade_unidades_estimada} unidades
                  </span>
                  <button type="button" onClick={() => onConfirmSpec(item.product_id, item._token, false)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 underline underline-offset-2">
                    Alterar
                  </button>
                </div>
              )}

              {costPerUnit !== null && (
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 dark:bg-zinc-950 rounded-xl">
                  <div>
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Custo por unidade</p>
                    <p className="text-[10px] text-zinc-500">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(pkgPrice)} ÷ {pkgUnits} un</p>
                  </div>
                  <span className="text-lg font-black text-white">
                    R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(costPerUnit)}
                    <span className="text-[9px] font-black text-zinc-500 ml-0.5">/un</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function VendorPortal() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<QuoteData | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [isDark, setIsDark] = useState(false);

  const updateItemField = useCallback((productId: string, itemToken: string | undefined, field: string, value: any) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, [field]: value }
        : item
    ));
  }, []);

  const applyVariant = useCallback((productId: string, itemToken: string | undefined, variant: HistoryVariant) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? {
            ...item,
            quantidade_venda: variant.quantidade_venda || '',
            quantidade_unidades_estimada: variant.quantidade_unidades_estimada || '',
            unidade_venda: variant.unidade_venda || 'kg',
            gramatura: variant.gramatura || '',
            dimensoes: variant.dimensoes || '',
            _spec_confirmed: true,
          }
        : item
    ));
  }, []);

  const confirmSpec = useCallback((productId: string, itemToken: string | undefined, confirmed: boolean) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, _spec_confirmed: confirmed, _spec_expanded: !confirmed }
        : item
    ));
  }, []);

  const toggleSpecExpanded = useCallback((productId: string, itemToken: string | undefined) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, _spec_expanded: !item._spec_expanded }
        : item
    ));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!token) {
        setError("Link de acesso inválido ou expirado.");
        setLoading(false);
        return;
      }
      try {
        const tokens = parseTokensDefensively(token);
        const allItems: QuoteItem[] = [];
        let anyOpen = false;
        let mainQuoteData: QuoteData | null = null;
        let hasErrors = false;
        let lastError: any = null;

        await Promise.all(tokens.map(async (tk) => {
          try {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(tk)) { hasErrors = true; return; }

            let { data: result, error: tokenError } = await supabase.rpc('get_vendor_quote_data', { p_token: tk });

            if (tokenError || !result) {
              const { data: pkgResult, error: pkgError } = await supabase.rpc('get_packaging_vendor_quote_data', { p_token: tk });
              if (pkgResult) { result = pkgResult; tokenError = null; }
              else { lastError = pkgError || tokenError; }
            }

            if (!result) { lastError = lastError || tokenError || { message: 'Token não encontrado' }; hasErrors = true; return; }

            const qd = result as unknown as QuoteData;
            if (!mainQuoteData) {
              mainQuoteData = { ...qd };
            } else {
              if (qd.deadline && (!mainQuoteData.deadline || new Date(qd.deadline) < new Date(mainQuoteData.deadline))) {
                mainQuoteData.deadline = qd.deadline;
              }
              if ((qd as any).created_at && (!mainQuoteData.created_at || new Date((qd as any).created_at) < new Date(mainQuoteData.created_at))) {
                mainQuoteData.created_at = (qd as any).created_at;
              }
            }

            if (qd.status === 'ativa' || qd.status === 'ativo' || qd.status === 'pendente') {
              anyOpen = true;
              const formattedItems = (qd.items || []).map(item => {
                const spec = item.last_spec as HistoryVariant | null;
                const hasCurrentData = item.quantidade_venda || item.quantidade_unidades_estimada;
                return {
                  ...item,
                  _token: tk,
                  _quote_id: qd.quote_id,
                  is_packaging: qd.is_packaging || item.is_packaging,
                  valor_oferecido: item.valor_oferecido
                    ? Number(item.valor_oferecido).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "",
                  quantidade_por_caixa: item.quantidade_por_caixa ? String(item.quantidade_por_caixa) : "",
                  quantidade_venda: hasCurrentData ? (item.quantidade_venda || '') : (spec?.quantidade_venda || ''),
                  quantidade_unidades_estimada: hasCurrentData ? (item.quantidade_unidades_estimada || '') : (spec?.quantidade_unidades_estimada || ''),
                  unidade_venda: hasCurrentData ? (item.unidade_venda || 'kg') : (spec?.unidade_venda || 'kg'),
                  gramatura: hasCurrentData ? (item.gramatura || '') : (spec?.gramatura || ''),
                  dimensoes: hasCurrentData ? (item.dimensoes || '') : (spec?.dimensoes || ''),
                  _spec_confirmed: hasCurrentData ? true : undefined,
                  _spec_expanded: !spec && !hasCurrentData,
                };
              });
              allItems.push(...formattedItems);
            }
          } catch (e) { hasErrors = true; }
        }));

        if (!mainQuoteData && hasErrors) throw new Error("Erro no Banco: " + (lastError ? JSON.stringify(lastError) : "Nenhum dado retornado"));
        if (!anyOpen) {
          setError("Todas as cotações deste link já foram encerradas e não aceitam mais propostas.");
        } else {
          setData(mainQuoteData);
          setItems(allItems);
        }
      } catch (err: any) {
        setError(err.message || "Erro ao carregar os dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadData();

    if (token) {
      const tokens = parseTokensDefensively(token);
      const channels = tokens.map(tk =>
        supabase.channel(`vendor-portal-${tk}`)
          .on('postgres_changes' as any, { event: 'UPDATE', table: 'quotes' }, (payload: any) => {
            if (payload.new?.status === 'concluida') {
              setError("Esta cotação foi encerrada e não aceita mais propostas.");
            }
          })
          .subscribe()
      );
      return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
    }
  }, [token]);

  const handlePriceChange = useCallback((productId: string, itemToken: string | undefined, value: string) => {
    const formatted = formatInputToBRL(value);
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, valor_oferecido: formatted }
        : item
    ));
  }, []);

  const handleObsChange = useCallback((productId: string, itemToken: string | undefined, value: string) => {
    setItems(prev => prev.map(item =>
      (item.product_id === productId && item._token === itemToken)
        ? { ...item, observacoes: value }
        : item
    ));
  }, []);

  const handleBoxQtyChange = useCallback((productId: string, itemToken: string | undefined, value: string) => {
    const val = value.replace(/\D/g, "");
    setItems(prev => prev.map(it =>
      (it.product_id === productId && it._token === itemToken)
        ? { ...it, quantidade_por_caixa: val }
        : it
    ));
  }, []);

  const handleReview = () => {
    const hasAnyPrice = items.some(i => {
      const val = i.valor_oferecido?.toString().replace(",", ".");
      return val && Number(val) > 0;
    });
    if (!hasAnyPrice) {
      toast({ title: "Nenhum preço informado", description: "Preencha o preço de pelo menos um produto.", variant: "destructive" });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    setShowConfirmDialog(false);
    setSaving(true);
    try {
      const tokens = parseTokensDefensively(token);
      await Promise.all(tokens.map(async (tk) => {
        const payload = items
          .filter(i => i._token === tk && i.valor_oferecido !== null && i.valor_oferecido !== "")
          .map(i => {
            const numValue = parseFloat(i.valor_oferecido!.toString().replace(/\./g, "").replace(",", "."));
            const qtdCaixa = i.quantidade_por_caixa ? parseInt(i.quantidade_por_caixa, 10) : null;
            const base: any = {
              product_id: i.product_id,
              valor_oferecido: numValue,
              observacoes: i.observacoes || "",
              quantidade_por_caixa: (qtdCaixa && qtdCaixa > 0) ? qtdCaixa : null
            };
            if (i.is_packaging) {
              base.product_name = i.product_name;
              base.unidade = i.unidade_venda || 'kg';
              base.quantidade_venda = i.quantidade_venda ? parseFloat(String(i.quantidade_venda).replace(",", ".")) : null;
              base.quantidade_unidades_estimada = (i.quantidade_unidades_estimada && !isNaN(parseInt(String(i.quantidade_unidades_estimada))))
                ? parseInt(String(i.quantidade_unidades_estimada), 10) : null;
              base.gramatura = (i.gramatura && !isNaN(parseFloat(String(i.gramatura).replace(",", "."))))
                ? parseFloat(String(i.gramatura).replace(",", ".")) : null;
              base.dimensoes = i.dimensoes || null;
            }
            return base;
          });

        if (payload.length > 0) {
          const isPkg = items.find(i => i._token === tk)?.is_packaging;
          const rpcName = isPkg ? 'save_packaging_vendor_quote_items' : 'save_vendor_quote_items';
          const { error: saveError } = await supabase.rpc(rpcName, { p_token: tk, p_items: payload });
          if (saveError) throw saveError;
        }
      }));

      if (data?.supplier_name) {
        const notifyMsg = `🔔 *Nova Resposta de Cotação!*\n\nO fornecedor *${data.supplier_name}* acaba de preencher uma cotação no portal.\n\nOs preços já estão disponíveis no sistema para conferência.`;
        await sendWhatsApp("11966670314", notifyMsg, data.company_id);
      }

      setSaving(false);
      requestAnimationFrame(() => {
        setSuccess(true);
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      });
    } catch (err: any) {
      setSaving(false);
      toast({ title: "Falha ao enviar", description: "Não foi possível processar sua proposta. Tente novamente.", variant: "destructive" });
    }
  };

  const rootClasses = cn("min-h-screen font-sans antialiased", isDark ? "dark" : "");

  // ── SPLASH ─────────────────────────────────────────────────────────────────
  if (showSplash || loading) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/8 blur-[140px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/8 blur-[140px]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight text-white">Cotá<span className="text-blue-400">JA</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Carregando sua cotação</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ERRO ───────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-3xl p-10 text-center shadow-xl space-y-6">
            <div className="mx-auto w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Acesso Indisponível</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm transition-all active:scale-95"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCESSO ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className={rootClasses}>
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden animate-in fade-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Proposta Enviada!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                Sua cotação foi registrada com sucesso. A equipe de compras já foi notificada.
              </p>
            </div>
            <div className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl p-5 text-left space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Enviado para</p>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Mercadão Novo Boi João Dias</p>
              <p className="text-xs text-zinc-400">CNPJ: 63.195.471/0001-12</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-0 w-full text-center">
            <p className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.2em]">CotáJA · Portal Fornecedor</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO ─────────────────────────────────────────────────────────────
  const itemsFilled = items.filter(i => {
    const val = i.valor_oferecido?.toString().replace(",", ".");
    return val && Number(val) > 0;
  }).length;

  const allFilled = itemsFilled === items.length;

  return (
    <div className={rootClasses}>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">

        {/* AlertDialog de confirmação — aparece SOBRE o formulário */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="rounded-2xl max-w-sm border-zinc-200 dark:border-white/10 shadow-2xl">
            <AlertDialogHeader className="text-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center mb-2 mx-auto">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <AlertDialogTitle className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                Enviar Proposta?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Você está enviando <strong className="text-zinc-700 dark:text-zinc-200">{itemsFilled} {itemsFilled === 1 ? 'item cotado' : 'itens cotados'}</strong> para o <strong className="text-zinc-700 dark:text-zinc-200">Mercadão Novo Boi João Dias</strong>.
                <br /><br />
                Após o envio, a equipe de compras será notificada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <AlertDialogAction
                onClick={handleSubmit}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm transition-all active:scale-95"
              >
                <Send className="h-4 w-4 mr-2" />
                Confirmar e Enviar Agora
              </AlertDialogAction>
              <AlertDialogCancel className="w-full h-11 rounded-xl border-zinc-200 dark:border-white/10 font-bold text-sm text-zinc-600 dark:text-zinc-300">
                Voltar e Revisar
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* HEADER */}
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-100 dark:border-white/5">
          <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20 flex-shrink-0">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-extrabold text-zinc-900 dark:text-zinc-50 leading-none truncate">
                  {data.supplier_name}
                </p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Portal de Cotações</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {items.length > 0 && (
                <span className={cn(
                  "text-[10px] font-black tabular-nums transition-colors duration-300",
                  allFilled ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"
                )}>
                  {itemsFilled}/{items.length}
                </span>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Seguro</span>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full transition-all duration-500",
                allFilled ? "bg-emerald-500" : "bg-blue-500"
              )}
              style={{ width: items.length > 0 ? `${(itemsFilled / items.length) * 100}%` : '0%' }}
            />
          </div>
        </header>

        {/* INFO FATURAMENTO */}
        <div className="max-w-xl mx-auto px-4 pt-5">
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl" />
            <div className="flex items-center justify-between pl-5 pr-4 py-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Faturar para</p>
                <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 truncate">Mercadão Novo Boi João Dias</p>
                <p className="text-[10px] text-zinc-400 font-medium">CNPJ 63.195.471/0001-12</p>
              </div>
              {data.deadline && (
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Prazo</p>
                  <p className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100">
                    {new Date(data.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS */}
        <main className="flex-1 overflow-y-auto max-w-xl w-full mx-auto px-4 py-5 pb-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
            {itemsFilled > 0 && (
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{itemsFilled}/{items.length} preenchidos</p>
            )}
          </div>

          {items.map((item, index) => (
            <VendorItem
              key={`${item.product_id}-${item._token}`}
              item={item}
              index={index}
              onPriceChange={handlePriceChange}
              onObsChange={handleObsChange}
              onBoxQtyChange={handleBoxQtyChange}
              onUpdateField={updateItemField}
              onToggleSpec={toggleSpecExpanded}
              onConfirmSpec={confirmSpec}
              onApplyVariant={applyVariant}
            />
          ))}

          <div className="pt-4 pb-2 text-center">
            <p className="text-[9px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em]">CotáJA · Portal Fornecedor</p>
          </div>
        </main>

        {/* BARRA DE AÇÃO */}
        <div className="flex-shrink-0 w-full p-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-xl mx-auto">
            <div className={cn(
              "border rounded-2xl shadow-2xl p-3 flex items-center gap-3 transition-all duration-300",
              allFilled
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 shadow-emerald-500/10"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 shadow-zinc-900/20 dark:shadow-black/40"
            )}>
              {/* Progresso */}
              <div className="flex-1 min-w-0 pl-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Progresso</span>
                  {allFilled ? (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Tudo preenchido!
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                      {items.length - itemsFilled} {items.length - itemsFilled === 1 ? 'pendente' : 'pendentes'}
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      allFilled ? "bg-emerald-500" : "bg-blue-500"
                    )}
                    style={{ width: items.length > 0 ? `${(itemsFilled / items.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Botão */}
              <button
                onClick={handleReview}
                disabled={saving}
                className={cn(
                  "h-12 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 shadow-lg",
                  allFilled
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                )}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {allFilled ? "Enviar Tudo" : "Enviar Proposta"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
