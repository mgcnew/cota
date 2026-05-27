import { memo, useCallback } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { LazyImage } from "@/components/responsive/LazyImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  History, Package, Trash2, ClipboardList,
  TrendingUp, TrendingDown, Minus, Edit, MoreVertical,
} from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import type { Product } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface MobileProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onHistory?: (product: Product) => void;
  style?: React.CSSProperties;
}

const getProductStatus = (product: Product) => {
  if (product.quotesCount === 0) return "sem_cotacao";
  if (product.lastOrderPrice === "R$ 0,00") return "pendente";
  if (product.quotesCount >= 3) return "ativo";
  return "cotado";
};

const STATUS_ACCENT: Record<string, string> = {
  ativo:       "bg-emerald-500",
  cotado:      "bg-blue-500",
  pendente:    "bg-amber-500",
  sem_cotacao: "bg-orange-400",
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  if (trend === "up")   return <TrendingUp   className="h-3 w-3 text-emerald-500" />;
  if (trend === "down") return <TrendingDown  className="h-3 w-3 text-red-400"     />;
  return                       <Minus         className="h-3 w-3 text-zinc-400"    />;
};

export const MobileProductCard = memo<MobileProductCardProps>(({
  product,
  onEdit,
  onDelete,
  onHistory,
  style,
}) => {
  const status = getProductStatus(product);
  const accent = STATUS_ACCENT[status] ?? "bg-zinc-400";

  const handleEdit    = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onEdit(product);    }, [onEdit,    product]);
  const handleDelete  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDelete(product);  }, [onDelete,  product]);
  const handleHistory = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onHistory?.(product); }, [onHistory, product]);

  return (
    <div
      style={style}
      className="relative bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform"
    >
      {/* Left accent border by status */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accent)} />

      <div className="pl-4 pr-3 py-3">
        {/* Top row: image + name + price + menu */}
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border dark:border-white/5">
            {product.image_url ? (
              <LazyImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                showSkeleton
                fallback={<Package className="h-4 w-4 text-muted-foreground" />}
              />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Name + category */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {capitalize(product.name)}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {capitalize(product.brand_name || product.category || "—")}
            </p>
          </div>

          {/* Price */}
          <div className="text-right shrink-0 mr-1">
            <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {product.lastOrderPrice}
            </p>
            <p className="text-[10px] text-muted-foreground/60">por {product.unit || "un"}</p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              {onHistory && (
                <DropdownMenuItem onClick={handleHistory} className="gap-2">
                  <History className="h-4 w-4" /> Histórico de Preços
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30">
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom row: status + cotações + trend */}
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge status={status} className="text-[10px] h-5 px-2" />
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
            <ClipboardList className="h-3 w-3" />
            <span className="font-medium">{product.quotesCount || 0} cot.</span>
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(product.trend)}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.product.id              === next.product.id              &&
  prev.product.name            === next.product.name            &&
  prev.product.category        === next.product.category        &&
  prev.product.lastOrderPrice  === next.product.lastOrderPrice  &&
  prev.product.quotesCount     === next.product.quotesCount     &&
  prev.product.trend           === next.product.trend           &&
  prev.product.image_url       === next.product.image_url       &&
  prev.product.brand_name      === next.product.brand_name
);

MobileProductCard.displayName = "MobileProductCard";

export default MobileProductCard;
