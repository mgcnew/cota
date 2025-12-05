import * as React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "./ResponsiveModal";
import { Filter, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * Filter configuration for MobileFilters
 */
export interface FilterConfig {
  /**
   * Unique key for the filter
   */
  key: string;
  /**
   * Display label for the filter
   */
  label: string;
  /**
   * Filter type
   */
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'search' | 'custom';
  /**
   * Options for select/multiselect filters
   */
  options?: Array<{ value: string; label: string }>;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Custom render function for the filter
   */
  render?: (value: any, onChange: (value: any) => void) => React.ReactNode;
}

export interface MobileFiltersProps {
  /**
   * Filter configurations
   */
  filters: FilterConfig[];
  /**
   * Current filter values
   */
  values: Record<string, any>;
  /**
   * Callback when a filter value changes
   */
  onChange: (key: string, value: any) => void;
  /**
   * Callback when filters are applied
   */
  onApply: () => void;
  /**
   * Callback when filters are reset
   */
  onReset: () => void;
  /**
   * Title for the filter modal
   * @default "Filtros"
   */
  title?: string;
  /**
   * Description for the filter modal
   */
  description?: string;
  /**
   * Custom trigger button
   */
  trigger?: React.ReactNode;
  /**
   * Additional class name for the trigger button
   */
  triggerClassName?: string;
  /**
   * Apply button text
   * @default "Aplicar"
   */
  applyText?: string;
  /**
   * Reset button text
   * @default "Limpar"
   */
  resetText?: string;
  /**
   * Children to render as filter content (alternative to filters prop)
   */
  children?: React.ReactNode;
}

/**
 * Count active filters
 */
function countActiveFilters(values: Record<string, any>): number {
  return Object.values(values).filter((value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;
}

/**
 * MobileFilters - A bottom sheet filter component optimized for mobile.
 * 
 * Features:
 * - Uses ResponsiveModal as base (bottom sheet on mobile, dialog on desktop)
 * - Apply/Reset actions in footer
 * - Shows active filter count badge
 * - Supports various filter types
 * - Touch-optimized spacing and targets
 * 
 * @example
 * ```tsx
 * <MobileFilters
 *   filters={[
 *     { key: 'category', label: 'Categoria', type: 'select', options: categories },
 *     { key: 'status', label: 'Status', type: 'multiselect', options: statuses },
 *   ]}
 *   values={filterValues}
 *   onChange={(key, value) => setFilterValues(prev => ({ ...prev, [key]: value }))}
 *   onApply={handleApplyFilters}
 *   onReset={handleResetFilters}
 * />
 * 
 * // Or with custom children
 * <MobileFilters
 *   filters={[]}
 *   values={filterValues}
 *   onChange={() => {}}
 *   onApply={handleApply}
 *   onReset={handleReset}
 * >
 *   <CategorySelect value={category} onChange={setCategory} />
 *   <DateRangePicker value={dateRange} onChange={setDateRange} />
 * </MobileFilters>
 * ```
 * 
 * Requirements: 7.4
 */
export function MobileFilters({
  filters,
  values,
  onChange,
  onApply,
  onReset,
  title = "Filtros",
  description,
  trigger,
  triggerClassName,
  applyText = "Aplicar",
  resetText = "Limpar",
  children,
}: MobileFiltersProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(values);
  const hasActiveFilters = activeCount > 0;

  const handleApply = useCallback(() => {
    onApply();
    setIsOpen(false);
  }, [onApply]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  // Render filter based on type
  const renderFilter = useCallback((filter: FilterConfig) => {
    const value = values[filter.key];
    const handleChange = (newValue: any) => onChange(filter.key, newValue);

    // Use custom render if provided
    if (filter.render) {
      return filter.render(value, handleChange);
    }

    // Default renders based on type
    switch (filter.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">{filter.placeholder || `Selecione ${filter.label}`}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'search':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={filter.placeholder || `Buscar ${filter.label}`}
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm"
          />
        );
      default:
        return null;
    }
  }, [values, onChange]);

  // Footer with apply/reset buttons
  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <div className="text-sm text-muted-foreground">
        {hasActiveFilters ? (
          <span className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            {activeCount} filtro{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''}
          </span>
        ) : (
          <span>Nenhum filtro ativo</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-11 min-w-[44px] gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {resetText}
          </Button>
        )}
        <Button
          onClick={handleApply}
          size="sm"
          className="h-11 min-w-[44px] gap-2"
        >
          <Check className="h-4 w-4" />
          {applyText}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      {trigger || (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-11 min-h-[44px] min-w-[44px] gap-2",
            hasActiveFilters && "border-primary/50 bg-primary/5",
            triggerClassName
          )}
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Filter modal (bottom sheet on mobile, dialog on desktop) */}
      <ResponsiveModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        title={title}
        description={description}
        footer={footer}
        desktopMaxWidth="md"
      >
        <div className="space-y-4">
          {/* Render children if provided */}
          {children}
          
          {/* Render filters from config */}
          {!children && filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {filter.label}
              </label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>
      </ResponsiveModal>
    </>
  );
}

export default MobileFilters;
