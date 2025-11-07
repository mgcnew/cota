import { useState, useEffect } from "react";
import { Calculator, Package, TrendingDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PriceConverterProps {
  currentValue?: number;
  productQuantity: string;
  productUnit: string; // "kg", "un", "cx"
  onConvert: (convertedValue: number) => void;
  trigger?: React.ReactNode;
}

/**
 * Calculadora de conversão de preços
 * Converte preço por caixa para preço por kg/unidade
 */
export function PriceConverter({
  currentValue = 0,
  productQuantity,
  productUnit,
  onConvert,
  trigger
}: PriceConverterProps) {
  const [open, setOpen] = useState(false);
  const [pricePerBox, setPricePerBox] = useState("");
  const [quantityPerBox, setQuantityPerBox] = useState("");
  const [conversionUnit, setConversionUnit] = useState<"kg" | "un">(
    productUnit === "kg" ? "kg" : productUnit === "un" ? "un" : "kg"
  );
  const [result, setResult] = useState<number | null>(null);

  // Atualizar unidade de conversão quando a unidade do produto mudar
  useEffect(() => {
    if (productUnit === "kg" || productUnit === "un") {
      setConversionUnit(productUnit);
    } else {
      // Se for caixa, usar kg como padrão
      setConversionUnit("kg");
    }
  }, [productUnit]);

  // Normalizar número (aceita vírgula ou ponto como separador decimal)
  const normalizeNumber = (value: string): number => {
    if (!value || !value.trim()) return 0;
    let normalized = value.trim();
    
    // Se tiver vírgula, assume formato brasileiro (vírgula como separador decimal)
    if (normalized.includes(",")) {
      // Remove pontos (separadores de milhar) e substitui vírgula por ponto
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
    // Se tiver ponto mas não vírgula, pode ser formato internacional
    // Mas também pode ser formato brasileiro com ponto como separador de milhar
    // Por segurança, vamos tratar como formato internacional se tiver apenas um ponto
    
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  // Calcular resultado automaticamente
  useEffect(() => {
    const price = normalizeNumber(pricePerBox);
    const quantity = normalizeNumber(quantityPerBox);

    if (price > 0 && quantity > 0) {
      const calculated = price / quantity;
      setResult(calculated);
    } else {
      setResult(null);
    }
  }, [pricePerBox, quantityPerBox]);

  const handleApply = () => {
    if (result !== null && result > 0) {
      onConvert(result);
      setOpen(false);
      // Limpar campos após aplicar
      setPricePerBox("");
      setQuantityPerBox("");
      setResult(null);
    }
  };

  const handleReset = () => {
    setPricePerBox("");
    setQuantityPerBox("");
    setResult(null);
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
      title="Calcular preço por caixa"
    >
      <Calculator className="h-4 w-4" />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-72 p-0 z-[100] shadow-xl max-h-[480px]" 
        align="end"
        side="left"
        sideOffset={5}
        alignOffset={0}
      >
        <Card className="border-0 shadow-none flex flex-col h-full max-h-[480px]">
          <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center gap-2 border-b pb-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                <Calculator className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                  Calculadora de Preços
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  Caixa → {conversionUnit === "kg" ? "kg" : "unidade"}
                </p>
              </div>
            </div>

            {/* Informação do produto */}
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="h-3 w-3 text-gray-500 flex-shrink-0" />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
                  Necessário: {productQuantity} {productUnit}
                </span>
              </div>
              {currentValue > 0 && (
                <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                  Atual: R$ {currentValue.toFixed(2)}/{productUnit}
                </div>
              )}
            </div>

            {/* Campos de entrada */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label htmlFor="price-per-box" className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  Preço por Caixa (R$)
                </Label>
                <Input
                  id="price-per-box"
                  type="text"
                  placeholder="120,50"
                  value={pricePerBox}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Permitir apenas números, vírgula e ponto
                    value = value.replace(/[^\d,.]/g, "");
                    // Garantir apenas uma vírgula ou ponto
                    const parts = value.split(/[,.]/);
                    if (parts.length > 2) {
                      value = parts[0] + (parts[1] || "") + (parts.slice(2).join(""));
                    }
                    setPricePerBox(value);
                  }}
                  className="h-8 text-xs font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity-per-box" className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  Qtde por Caixa ({conversionUnit})
                </Label>
                <Input
                  id="quantity-per-box"
                  type="text"
                  placeholder={`12,5 ${conversionUnit}`}
                  value={quantityPerBox}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Permitir apenas números, vírgula e ponto
                    value = value.replace(/[^\d,.]/g, "");
                    // Garantir apenas uma vírgula ou ponto
                    const parts = value.split(/[,.]/);
                    if (parts.length > 2) {
                      value = parts[0] + (parts[1] || "") + (parts.slice(2).join(""));
                    }
                    setQuantityPerBox(value);
                  }}
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* Resultado */}
            {result !== null && result > 0 && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      Resultado
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 h-4">
                    {conversionUnit === "kg" ? "kg" : "un"}
                  </Badge>
                </div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                  R$ {result.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  por {conversionUnit === "kg" ? "quilograma" : "unidade"}
                </div>
              </div>
            )}

            {/* Dica */}
            <div className="pt-1.5 border-t">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
                💡 <strong>Dica:</strong> Ex: R$ 120,50 por caixa com 12,5 kg = R$ 9,64/kg
              </p>
            </div>
          </div>
          
          {/* Ações - Fixas na parte inferior */}
          <div className="flex gap-2 p-3 pt-2 border-t bg-white dark:bg-[#1C1F26] flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 h-8 text-[11px]"
              disabled={!pricePerBox && !quantityPerBox}
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              disabled={result === null || result <= 0}
              className="flex-1 h-8 text-[11px] bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="h-3 w-3 mr-1" />
              Aplicar
            </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
