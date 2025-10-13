/**
 * =====================================================
 * UTILITÁRIO PARA REMOÇÃO DE DUPLICATAS
 * =====================================================
 * Este arquivo fornece uma interface TypeScript para
 * executar as funções SQL de remoção de duplicatas
 * =====================================================
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface DuplicateStats {
  table_name: string;
  total_records: number;
  duplicate_groups: number;
  total_duplicates: number;
  potential_removals: number;
}

export interface ProductDuplicate {
  duplicate_count: number;
  name: string;
  category: string;
  user_id: string;
  oldest_id: string;
  newest_id: string;
  oldest_created_at: string;
  newest_created_at: string;
}

export interface SupplierDuplicate {
  duplicate_count: number;
  name: string;
  cnpj: string;
  user_id: string;
  oldest_id: string;
  newest_id: string;
  oldest_created_at: string;
  newest_created_at: string;
}

export interface CleanupResult {
  table_name: string;
  action: string;
  item_name: string;
  removed_count: number;
  details: any;
}

// =====================================================
// CLASSE PRINCIPAL
// =====================================================

export class DuplicateRemover {
  private userId: string | null = null;

  constructor(userId?: string) {
    this.userId = userId || null;
  }

  /**
   * Obtém estatísticas de duplicatas
   */
  async getStats(): Promise<DuplicateStats[]> {
    try {
      const { data, error } = await supabase.rpc('get_duplicate_stats', {
        user_uuid: this.userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao obter estatísticas de duplicatas:', error);
      throw error;
    }
  }

  /**
   * Detecta duplicatas em produtos
   */
  async detectProductDuplicates(): Promise<ProductDuplicate[]> {
    try {
      const { data, error } = await supabase.rpc('detect_product_duplicates', {
        user_uuid: this.userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao detectar duplicatas de produtos:', error);
      throw error;
    }
  }

  /**
   * Detecta duplicatas em fornecedores
   */
  async detectSupplierDuplicates(): Promise<SupplierDuplicate[]> {
    try {
      const { data, error } = await supabase.rpc('detect_supplier_duplicates', {
        user_uuid: this.userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao detectar duplicatas de fornecedores:', error);
      throw error;
    }
  }

  /**
   * Remove duplicatas de produtos (com opção de dry run)
   */
  async removeProductDuplicates(dryRun: boolean = true): Promise<CleanupResult[]> {
    try {
      const { data, error } = await supabase.rpc('remove_product_duplicates', {
        user_uuid: this.userId,
        dry_run: dryRun
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao remover duplicatas de produtos:', error);
      throw error;
    }
  }

  /**
   * Remove duplicatas de fornecedores (com opção de dry run)
   */
  async removeSupplierDuplicates(dryRun: boolean = true): Promise<CleanupResult[]> {
    try {
      const { data, error } = await supabase.rpc('remove_supplier_duplicates', {
        user_uuid: this.userId,
        dry_run: dryRun
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao remover duplicatas de fornecedores:', error);
      throw error;
    }
  }

  /**
   * Executa limpeza completa de todas as duplicatas
   */
  async cleanupAllDuplicates(dryRun: boolean = true): Promise<CleanupResult[]> {
    try {
      const { data, error } = await supabase.rpc('cleanup_all_duplicates', {
        user_uuid: this.userId,
        dry_run: dryRun
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao executar limpeza completa:', error);
      throw error;
    }
  }

  /**
   * Gera relatório completo de duplicatas
   */
  async generateReport(): Promise<{
    stats: DuplicateStats[];
    productDuplicates: ProductDuplicate[];
    supplierDuplicates: SupplierDuplicate[];
    summary: {
      totalDuplicateGroups: number;
      totalPotentialRemovals: number;
      hasIssues: boolean;
    };
  }> {
    try {
      const [stats, productDuplicates, supplierDuplicates] = await Promise.all([
        this.getStats(),
        this.detectProductDuplicates(),
        this.detectSupplierDuplicates()
      ]);

      const totalDuplicateGroups = stats.reduce((sum, stat) => sum + stat.duplicate_groups, 0);
      const totalPotentialRemovals = stats.reduce((sum, stat) => sum + stat.potential_removals, 0);

      return {
        stats,
        productDuplicates,
        supplierDuplicates,
        summary: {
          totalDuplicateGroups,
          totalPotentialRemovals,
          hasIssues: totalDuplicateGroups > 0
        }
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Executa processo completo de limpeza com confirmação
   */
  async performSafeCleanup(): Promise<{
    dryRunResults: CleanupResult[];
    actualResults?: CleanupResult[];
    success: boolean;
    message: string;
  }> {
    try {
      // Primeiro, executa dry run
      console.log('🔍 Executando simulação de limpeza...');
      const dryRunResults = await this.cleanupAllDuplicates(true);
      
      const totalToRemove = dryRunResults
        .filter(r => r.table_name !== 'summary')
        .reduce((sum, r) => sum + r.removed_count, 0);

      if (totalToRemove === 0) {
        return {
          dryRunResults,
          success: true,
          message: '✅ Nenhuma duplicata encontrada. Sistema limpo!'
        };
      }

      console.log(`⚠️  Encontradas ${totalToRemove} duplicatas para remoção.`);
      console.log('📋 Resultados da simulação:', dryRunResults);

      // Para segurança, não executa automaticamente a remoção real
      // O usuário deve chamar explicitamente cleanupAllDuplicates(false)
      return {
        dryRunResults,
        success: true,
        message: `⚠️  Encontradas ${totalToRemove} duplicatas. Execute cleanupAllDuplicates(false) para remover.`
      };

    } catch (error) {
      console.error('Erro durante limpeza segura:', error);
      return {
        dryRunResults: [],
        success: false,
        message: `❌ Erro durante limpeza: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Cria uma instância do removedor de duplicatas para o usuário atual
 */
export async function createDuplicateRemover(): Promise<DuplicateRemover> {
  const { data: { user } } = await supabase.auth.getUser();
  return new DuplicateRemover(user?.id);
}

/**
 * Função de conveniência para verificar duplicatas rapidamente
 */
export async function quickDuplicateCheck(): Promise<{
  hasIssues: boolean;
  summary: string;
  details: DuplicateStats[];
}> {
  try {
    const remover = await createDuplicateRemover();
    const stats = await remover.getStats();
    
    const totalIssues = stats.reduce((sum, stat) => sum + stat.potential_removals, 0);
    const hasIssues = totalIssues > 0;

    let summary = hasIssues 
      ? `⚠️  ${totalIssues} duplicatas encontradas`
      : '✅ Nenhuma duplicata encontrada';

    return {
      hasIssues,
      summary,
      details: stats
    };
  } catch (error) {
    return {
      hasIssues: true,
      summary: `❌ Erro ao verificar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      details: []
    };
  }
}

/**
 * Função para executar limpeza completa com logs detalhados
 */
export async function performDetailedCleanup(actuallyRemove: boolean = false): Promise<void> {
  try {
    console.log('🚀 Iniciando processo de limpeza de duplicatas...');
    
    const remover = await createDuplicateRemover();
    
    // Gerar relatório inicial
    console.log('📊 Gerando relatório inicial...');
    const report = await remover.generateReport();
    
    console.log('📈 Estatísticas:', report.stats);
    console.log('🔍 Duplicatas de produtos:', report.productDuplicates);
    console.log('🏢 Duplicatas de fornecedores:', report.supplierDuplicates);
    console.log('📋 Resumo:', report.summary);

    if (!report.summary.hasIssues) {
      console.log('✅ Sistema limpo! Nenhuma duplicata encontrada.');
      return;
    }

    // Executar limpeza
    console.log(`🧹 Executando limpeza (${actuallyRemove ? 'REAL' : 'SIMULAÇÃO'})...`);
    const results = await remover.cleanupAllDuplicates(!actuallyRemove);
    
    console.log('📋 Resultados da limpeza:', results);

    if (actuallyRemove) {
      console.log('✅ Limpeza concluída com sucesso!');
    } else {
      console.log('ℹ️  Simulação concluída. Para executar a remoção real, chame com actuallyRemove=true');
    }

  } catch (error) {
    console.error('❌ Erro durante limpeza detalhada:', error);
    throw error;
  }
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export default DuplicateRemover;

// Exemplo de uso no console do navegador:
/*
import { performDetailedCleanup, quickDuplicateCheck } from '@/utils/duplicateRemover';

// Verificação rápida
await quickDuplicateCheck();

// Simulação de limpeza
await performDetailedCleanup(false);

// Limpeza real (cuidado!)
await performDetailedCleanup(true);
*/