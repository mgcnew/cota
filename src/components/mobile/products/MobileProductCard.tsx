import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capitalize } from "@/lib/text-utils";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

interface MobileProductCardProps {
  product: ProductMobile;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Card de produto mobile otimizado
 * 
 * Features:
 * - Design limpo e moderno
 * - Ações rápidas (swipe ou menu)
 * - Lazy loading de imagens
 */
export function MobileProductCard({ product, onEdit, onDelete }: MobileProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-[#1C1F26] dark:via-[#1C1F26] dark:to-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Imagem do produto */}
          <div className="flex-shrink-0">
            {product.image_url && !imageError ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <span className="text-white font-bold text-lg">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Informações do produto */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                  {capitalize(product.name)}
                </h3>
                {product.category && (
                  <Badge
                    variant="outline"
                    className="mt-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                  >
                    {capitalize(product.category)}
                  </Badge>
                )}
                {product.unit && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Unidade: {product.unit}
                  </p>
                )}
              </div>

              {/* Menu de ações */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full flex-shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

