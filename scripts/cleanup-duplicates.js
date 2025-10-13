#!/usr/bin/env node

/**
 * =====================================================
 * SCRIPT DE LIMPEZA DE DUPLICATAS
 * =====================================================
 * Script para execução manual via linha de comando
 * para detectar e remover registros duplicados
 * =====================================================
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias');
  console.error('Verifique se o arquivo .env está configurado corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Funções utilitárias
async function getStats() {
  console.log('📊 Obtendo estatísticas...');
  
  const { data, error } = await supabase.rpc('get_duplicate_stats');
  
  if (error) {
    throw new Error(`Erro ao obter estatísticas: ${error.message}`);
  }
  
  return data || [];
}

async function detectProductDuplicates() {
  console.log('🔍 Detectando produtos duplicados...');
  
  const { data, error } = await supabase.rpc('detect_product_duplicates');
  
  if (error) {
    throw new Error(`Erro ao detectar produtos duplicados: ${error.message}`);
  }
  
  return data || [];
}

async function detectSupplierDuplicates() {
  console.log('🔍 Detectando fornecedores duplicados...');
  
  const { data, error } = await supabase.rpc('detect_supplier_duplicates');
  
  if (error) {
    throw new Error(`Erro ao detectar fornecedores duplicados: ${error.message}`);
  }
  
  return data || [];
}

async function removeProductDuplicates(dryRun = true) {
  const action = dryRun ? 'simulate_remove_product_duplicates' : 'remove_product_duplicates';
  console.log(`${dryRun ? '🧪' : '🗑️'} ${dryRun ? 'Simulando' : 'Executando'} remoção de produtos duplicados...`);
  
  const { data, error } = await supabase.rpc(action);
  
  if (error) {
    throw new Error(`Erro ao ${dryRun ? 'simular' : 'executar'} remoção de produtos: ${error.message}`);
  }
  
  return data || [];
}

async function removeSupplierDuplicates(dryRun = true) {
  const action = dryRun ? 'simulate_remove_supplier_duplicates' : 'remove_supplier_duplicates';
  console.log(`${dryRun ? '🧪' : '🗑️'} ${dryRun ? 'Simulando' : 'Executando'} remoção de fornecedores duplicados...`);
  
  const { data, error } = await supabase.rpc(action);
  
  if (error) {
    throw new Error(`Erro ao ${dryRun ? 'simular' : 'executar'} remoção de fornecedores: ${error.message}`);
  }
  
  return data || [];
}

// Funções de exibição
function displayStats(stats) {
  console.log('\n📊 ESTATÍSTICAS DO SISTEMA');
  console.log('═'.repeat(50));
  
  if (stats.length === 0) {
    console.log('✅ Nenhuma estatística disponível');
    return;
  }
  
  stats.forEach(stat => {
    console.log(`\n📋 Tabela: ${stat.table_name.toUpperCase()}`);
    console.log(`   Total de registros: ${stat.total_records}`);
    console.log(`   Duplicatas potenciais: ${stat.potential_removals}`);
    
    if (stat.potential_removals > 0) {
      console.log(`   ⚠️  Status: REQUER ATENÇÃO`);
    } else {
      console.log(`   ✅ Status: LIMPO`);
    }
  });
}

function displayDuplicates(duplicates, type) {
  console.log(`\n🔍 ${type.toUpperCase()} DUPLICADOS`);
  console.log('═'.repeat(50));
  
  if (duplicates.length === 0) {
    console.log(`✅ Nenhum ${type} duplicado encontrado`);
    return;
  }
  
  duplicates.forEach((duplicate, index) => {
    console.log(`\n${index + 1}. ${duplicate.name}`);
    if (type === 'produtos') {
      console.log(`   Categoria: ${duplicate.category}`);
    } else {
      console.log(`   CNPJ: ${duplicate.cnpj || 'N/A'}`);
    }
    console.log(`   Duplicatas: ${duplicate.duplicate_count}`);
    console.log(`   Criado em: ${new Date(duplicate.oldest_created_at).toLocaleString('pt-BR')} - ${new Date(duplicate.newest_created_at).toLocaleString('pt-BR')}`);
    console.log(`   ID mantido: ${duplicate.newest_id}`);
  });
}

function displayResults(results, type, dryRun) {
  const action = dryRun ? 'SIMULAÇÃO' : 'EXECUÇÃO';
  console.log(`\n${dryRun ? '🧪' : '✅'} RESULTADOS DA ${action} - ${type.toUpperCase()}`);
  console.log('═'.repeat(50));
  
  if (results.length === 0) {
    console.log(`ℹ️  Nenhum resultado para ${type}`);
    return;
  }
  
  let totalRemoved = 0;
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.item_name}`);
    console.log(`   Ação: ${result.action}`);
    console.log(`   Removidos: ${result.removed_count}`);
    totalRemoved += result.removed_count;
    
    if (result.details) {
      console.log(`   Detalhes: ${JSON.stringify(result.details)}`);
    }
  });
  
  console.log(`\n📊 Total de registros ${dryRun ? 'que seriam removidos' : 'removidos'}: ${totalRemoved}`);
}

// Menu principal
async function showMenu() {
  console.log('\n🛠️  MENU DE LIMPEZA DE DUPLICATAS');
  console.log('═'.repeat(40));
  console.log('1. Ver estatísticas gerais');
  console.log('2. Detectar produtos duplicados');
  console.log('3. Detectar fornecedores duplicados');
  console.log('4. Simular limpeza de produtos');
  console.log('5. Simular limpeza de fornecedores');
  console.log('6. Simular limpeza completa');
  console.log('7. EXECUTAR limpeza de produtos');
  console.log('8. EXECUTAR limpeza de fornecedores');
  console.log('9. EXECUTAR limpeza completa');
  console.log('0. Sair');
  console.log('═'.repeat(40));
  
  const choice = await question('Escolha uma opção: ');
  return choice.trim();
}

async function confirmAction(message) {
  const response = await question(`⚠️  ${message} (digite 'CONFIRMO' para continuar): `);
  return response.trim().toUpperCase() === 'CONFIRMO';
}

// Função principal
async function main() {
  console.log('🚀 SISTEMA DE LIMPEZA DE DUPLICATAS');
  console.log('═'.repeat(50));
  console.log('Este script permite detectar e remover registros duplicados');
  console.log('SEMPRE execute uma simulação antes da limpeza real!\n');
  
  try {
    while (true) {
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          try {
            const stats = await getStats();
            displayStats(stats);
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '2':
          try {
            const duplicates = await detectProductDuplicates();
            displayDuplicates(duplicates, 'produtos');
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '3':
          try {
            const duplicates = await detectSupplierDuplicates();
            displayDuplicates(duplicates, 'fornecedores');
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '4':
          try {
            const results = await removeProductDuplicates(true);
            displayResults(results, 'produtos', true);
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '5':
          try {
            const results = await removeSupplierDuplicates(true);
            displayResults(results, 'fornecedores', true);
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '6':
          try {
            console.log('🧪 Executando simulação completa...');
            const [productResults, supplierResults] = await Promise.all([
              removeProductDuplicates(true),
              removeSupplierDuplicates(true)
            ]);
            
            displayResults(productResults, 'produtos', true);
            displayResults(supplierResults, 'fornecedores', true);
          } catch (error) {
            console.error('❌ Erro:', error.message);
          }
          break;
          
        case '7':
          if (await confirmAction('Executar limpeza REAL de produtos duplicados?')) {
            try {
              const results = await removeProductDuplicates(false);
              displayResults(results, 'produtos', false);
              console.log('✅ Limpeza de produtos concluída!');
            } catch (error) {
              console.error('❌ Erro:', error.message);
            }
          } else {
            console.log('❌ Operação cancelada');
          }
          break;
          
        case '8':
          if (await confirmAction('Executar limpeza REAL de fornecedores duplicados?')) {
            try {
              const results = await removeSupplierDuplicates(false);
              displayResults(results, 'fornecedores', false);
              console.log('✅ Limpeza de fornecedores concluída!');
            } catch (error) {
              console.error('❌ Erro:', error.message);
            }
          } else {
            console.log('❌ Operação cancelada');
          }
          break;
          
        case '9':
          if (await confirmAction('Executar limpeza REAL COMPLETA do sistema?')) {
            try {
              console.log('🗑️ Executando limpeza completa...');
              const [productResults, supplierResults] = await Promise.all([
                removeProductDuplicates(false),
                removeSupplierDuplicates(false)
              ]);
              
              displayResults(productResults, 'produtos', false);
              displayResults(supplierResults, 'fornecedores', false);
              console.log('✅ Limpeza completa concluída!');
            } catch (error) {
              console.error('❌ Erro:', error.message);
            }
          } else {
            console.log('❌ Operação cancelada');
          }
          break;
          
        case '0':
          console.log('👋 Saindo...');
          rl.close();
          return;
          
        default:
          console.log('❌ Opção inválida');
      }
      
      await question('\nPressione Enter para continuar...');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  });
}

export {
  getStats,
  detectProductDuplicates,
  detectSupplierDuplicates,
  removeProductDuplicates,
  removeSupplierDuplicates
};