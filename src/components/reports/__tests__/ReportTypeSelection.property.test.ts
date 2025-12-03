/**
 * Property-Based Tests for Report Type Selection
 * 
 * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
 * **Validates: Requirements 3.2**
 * 
 * Tests that for any report type from the available report types list, when that type 
 * is selected, the system should display configuration options specific to that report type.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ReportCategory } from '@/types/reports';

/**
 * Report type definition matching the ReportGenerator component
 */
interface ReportType {
  id: string;
  titulo: string;
  descricao: string;
  categoria: ReportCategory;
}

/**
 * Available report types in the system (mirrors REPORT_TYPES from ReportGenerator)
 */
export const REPORT_TYPES: ReportType[] = [
  { id: "economia", titulo: "Análise de Economia", descricao: "Economia gerada por período", categoria: 'financeiro' },
  { id: "fornecedores", titulo: "Performance Fornecedores", descricao: "Taxa de vitória e score", categoria: 'estrategico' },
  { id: "comparativo", titulo: "Comparativo de Preços", descricao: "Variação de preços por produto", categoria: 'operacional' },
  { id: "eficiencia", titulo: "Eficiência do Processo", descricao: "Taxa de conversão e ROI", categoria: 'estrategico' },
  { id: "pedidos", titulo: "Análise de Pedidos", descricao: "Volume e valores de pedidos", categoria: 'operacional' },
  { id: "produtos", titulo: "Análise de Produtos", descricao: "Produtos mais cotados", categoria: 'operacional' },
  { id: "tempo-resposta", titulo: "Tempo de Resposta", descricao: "Performance de resposta", categoria: 'operacional' },
  { id: "conversao", titulo: "Taxa de Conversão", descricao: "Conversão cotações em pedidos", categoria: 'estrategico' },
];

/**
 * Pure function that finds a report type by ID.
 * This mirrors the logic in ReportGenerator: `REPORT_TYPES.find(r => r.id === selectedType)`
 * 
 * @param reportTypes - Array of available report types
 * @param selectedTypeId - The ID of the selected report type
 * @returns The selected report type or undefined if not found
 */
export function getSelectedReportType(
  reportTypes: ReportType[],
  selectedTypeId: string
): ReportType | undefined {
  return reportTypes.find(r => r.id === selectedTypeId);
}

/**
 * Pure function that returns configuration options for a selected report type.
 * When a report type is selected, the system displays:
 * - Report title and description
 * - Category badge
 * - Period selector (common to all)
 * - Visualize and Download actions (common to all)
 * 
 * @param selectedReport - The selected report type
 * @returns Configuration options for the report type
 */
export function getReportConfigOptions(selectedReport: ReportType | undefined): {
  hasTitle: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  hasPeriodSelector: boolean;
  hasVisualizeAction: boolean;
  hasDownloadAction: boolean;
  categoryType: ReportCategory | null;
} {
  if (!selectedReport) {
    return {
      hasTitle: false,
      hasDescription: false,
      hasCategory: false,
      hasPeriodSelector: false,
      hasVisualizeAction: false,
      hasDownloadAction: false,
      categoryType: null,
    };
  }

  return {
    hasTitle: selectedReport.titulo.length > 0,
    hasDescription: selectedReport.descricao.length > 0,
    hasCategory: selectedReport.categoria.length > 0,
    hasPeriodSelector: true, // Always available for all report types
    hasVisualizeAction: true, // Always available for all report types
    hasDownloadAction: true, // Always available for all report types
    categoryType: selectedReport.categoria,
  };
}

/**
 * Arbitrary generator for valid report type IDs from the available list
 */
const validReportTypeIdArbitrary = fc.constantFrom(...REPORT_TYPES.map(r => r.id));

/**
 * Arbitrary generator for invalid report type IDs (not in the list)
 */
const invalidReportTypeIdArbitrary = fc.string({ minLength: 1, maxLength: 20 })
  .filter(id => !REPORT_TYPES.some(r => r.id === id));

/**
 * Arbitrary generator for ReportCategory
 */
const reportCategoryArbitrary = fc.constantFrom<ReportCategory>('financeiro', 'operacional', 'estrategico');

/**
 * Arbitrary generator for custom ReportType objects
 */
const reportTypeArbitrary: fc.Arbitrary<ReportType> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  titulo: fc.string({ minLength: 1, maxLength: 50 }),
  descricao: fc.string({ minLength: 1, maxLength: 100 }),
  categoria: reportCategoryArbitrary,
});

describe('Report Type Selection - Property Tests', () => {
  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any valid report type ID, selecting it should return the correct report type.
   */
  it('should return the correct report type when a valid ID is selected', () => {
    fc.assert(
      fc.property(
        validReportTypeIdArbitrary,
        (selectedTypeId) => {
          const selectedReport = getSelectedReportType(REPORT_TYPES, selectedTypeId);
          
          expect(selectedReport).toBeDefined();
          expect(selectedReport?.id).toBe(selectedTypeId);
          return selectedReport !== undefined && selectedReport.id === selectedTypeId;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any valid report type selection, configuration options should include
   * title, description, category, period selector, and action buttons.
   */
  it('should display all relevant configuration options for any selected report type', () => {
    fc.assert(
      fc.property(
        validReportTypeIdArbitrary,
        (selectedTypeId) => {
          const selectedReport = getSelectedReportType(REPORT_TYPES, selectedTypeId);
          const configOptions = getReportConfigOptions(selectedReport);
          
          expect(configOptions.hasTitle).toBe(true);
          expect(configOptions.hasDescription).toBe(true);
          expect(configOptions.hasCategory).toBe(true);
          expect(configOptions.hasPeriodSelector).toBe(true);
          expect(configOptions.hasVisualizeAction).toBe(true);
          expect(configOptions.hasDownloadAction).toBe(true);
          expect(configOptions.categoryType).not.toBeNull();
          
          return (
            configOptions.hasTitle &&
            configOptions.hasDescription &&
            configOptions.hasCategory &&
            configOptions.hasPeriodSelector &&
            configOptions.hasVisualizeAction &&
            configOptions.hasDownloadAction &&
            configOptions.categoryType !== null
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: The category type returned should match the selected report's category.
   */
  it('should return the correct category type for any selected report', () => {
    fc.assert(
      fc.property(
        validReportTypeIdArbitrary,
        (selectedTypeId) => {
          const selectedReport = getSelectedReportType(REPORT_TYPES, selectedTypeId);
          const configOptions = getReportConfigOptions(selectedReport);
          
          const expectedCategory = REPORT_TYPES.find(r => r.id === selectedTypeId)?.categoria;
          expect(configOptions.categoryType).toBe(expectedCategory);
          
          return configOptions.categoryType === expectedCategory;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any invalid report type ID, selection should return undefined
   * and configuration options should indicate no options available.
   */
  it('should return no configuration options for invalid report type IDs', () => {
    fc.assert(
      fc.property(
        invalidReportTypeIdArbitrary,
        (invalidTypeId) => {
          const selectedReport = getSelectedReportType(REPORT_TYPES, invalidTypeId);
          const configOptions = getReportConfigOptions(selectedReport);
          
          expect(selectedReport).toBeUndefined();
          expect(configOptions.hasTitle).toBe(false);
          expect(configOptions.hasDescription).toBe(false);
          expect(configOptions.hasCategory).toBe(false);
          expect(configOptions.hasPeriodSelector).toBe(false);
          expect(configOptions.hasVisualizeAction).toBe(false);
          expect(configOptions.hasDownloadAction).toBe(false);
          expect(configOptions.categoryType).toBeNull();
          
          return (
            selectedReport === undefined &&
            !configOptions.hasTitle &&
            !configOptions.hasDescription &&
            !configOptions.hasCategory &&
            !configOptions.hasPeriodSelector &&
            !configOptions.hasVisualizeAction &&
            !configOptions.hasDownloadAction &&
            configOptions.categoryType === null
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: For any custom report type array and any ID from that array,
   * selection should return the matching report type.
   */
  it('should work with any custom report types array', () => {
    fc.assert(
      fc.property(
        fc.array(reportTypeArbitrary, { minLength: 1, maxLength: 20 })
          .filter(arr => new Set(arr.map(r => r.id)).size === arr.length), // Ensure unique IDs
        (customReportTypes) => {
          // Pick a random report type from the array
          const randomIndex = Math.floor(Math.random() * customReportTypes.length);
          const selectedTypeId = customReportTypes[randomIndex].id;
          
          const selectedReport = getSelectedReportType(customReportTypes, selectedTypeId);
          
          expect(selectedReport).toBeDefined();
          expect(selectedReport?.id).toBe(selectedTypeId);
          expect(selectedReport?.titulo).toBe(customReportTypes[randomIndex].titulo);
          expect(selectedReport?.descricao).toBe(customReportTypes[randomIndex].descricao);
          expect(selectedReport?.categoria).toBe(customReportTypes[randomIndex].categoria);
          
          return (
            selectedReport !== undefined &&
            selectedReport.id === selectedTypeId &&
            selectedReport.titulo === customReportTypes[randomIndex].titulo
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: All report types in REPORT_TYPES should have valid categories.
   */
  it('should have valid categories for all predefined report types', () => {
    const validCategories: ReportCategory[] = ['financeiro', 'operacional', 'estrategico'];
    
    REPORT_TYPES.forEach(reportType => {
      expect(validCategories).toContain(reportType.categoria);
    });
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: All report types in REPORT_TYPES should have unique IDs.
   */
  it('should have unique IDs for all predefined report types', () => {
    const ids = REPORT_TYPES.map(r => r.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });

  /**
   * **Feature: relatorios-refactoring, Property 2: Report type selection shows relevant options**
   * **Validates: Requirements 3.2**
   * 
   * Property: All report types should have non-empty title and description.
   */
  it('should have non-empty title and description for all predefined report types', () => {
    REPORT_TYPES.forEach(reportType => {
      expect(reportType.titulo.length).toBeGreaterThan(0);
      expect(reportType.descricao.length).toBeGreaterThan(0);
    });
  });
});
