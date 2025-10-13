import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctions() {
  console.log('🧪 Testando funções SQL de duplicatas...\n');
  
  try {
    // Testar função de estatísticas
    console.log('1. Testando get_duplicate_stats...');
    const { data: stats, error: statsError } = await supabase.rpc('get_duplicate_stats');
    
    if (statsError) {
      console.error('❌ Erro na função get_duplicate_stats:', statsError.message);
    } else {
      console.log('✅ get_duplicate_stats funcionando');
      console.log('   Dados:', stats);
    }
    
    // Testar função de detecção de produtos
    console.log('\n2. Testando detect_product_duplicates...');
    const { data: products, error: productsError } = await supabase.rpc('detect_product_duplicates');
    
    if (productsError) {
      console.error('❌ Erro na função detect_product_duplicates:', productsError.message);
    } else {
      console.log('✅ detect_product_duplicates funcionando');
      console.log('   Duplicatas encontradas:', products?.length || 0);
    }
    
    // Testar função de detecção de fornecedores
    console.log('\n3. Testando detect_supplier_duplicates...');
    const { data: suppliers, error: suppliersError } = await supabase.rpc('detect_supplier_duplicates');
    
    if (suppliersError) {
      console.error('❌ Erro na função detect_supplier_duplicates:', suppliersError.message);
    } else {
      console.log('✅ detect_supplier_duplicates funcionando');
      console.log('   Duplicatas encontradas:', suppliers?.length || 0);
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testFunctions();