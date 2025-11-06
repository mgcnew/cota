/**
 * Script para aplicar a migração que corrige o limite de produtos para owners
 * 
 * Este script executa o SQL diretamente no Supabase usando as credenciais do ambiente
 */

const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    // Tentar importar Supabase
    const { createClient } = require('@supabase/supabase-js');
    
    // Carregar variáveis de ambiente
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // Para executar SQL, precisamos da service_role_key, não da anon_key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      console.error('❌ Erro: VITE_SUPABASE_URL não encontrado');
      console.log('Configure a variável de ambiente VITE_SUPABASE_URL');
      process.exit(1);
    }
    
    if (!supabaseKey) {
      console.warn('⚠️  ATENÇÃO: Service Role Key não encontrada');
      console.log('Para executar SQL diretamente, você precisa da SERVICE_ROLE_KEY');
      console.log('Por segurança, é melhor executar via Supabase Dashboard');
      console.log('');
      console.log('📋 SQL para executar manualmente:');
      console.log('─'.repeat(60));
      
      const migrationPath = path.join(__dirname, '../supabase/migrations/20250121000001_fix_product_limit_for_owners.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      
      process.exit(0);
    }
    
    console.log('✅ Credenciais encontradas');
    console.log('🔄 Aplicando migração...');
    
    // Criar cliente com service role key
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250121000001_fix_product_limit_for_owners.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // O Supabase JS client não suporta executar SQL arbitrário diretamente
    // Precisamos usar o REST API ou RPC
    console.log('⚠️  O cliente Supabase JS não permite executar SQL arbitrário por segurança.');
    console.log('');
    console.log('📋 Opções para aplicar a migração:');
    console.log('');
    console.log('1. Via Supabase Dashboard (Recomendado):');
    console.log('   - Acesse: https://supabase.com/dashboard');
    console.log('   - SQL Editor → New Query');
    console.log('   - Cole o SQL abaixo');
    console.log('');
    console.log('2. Via Supabase CLI:');
    console.log('   npm install -g supabase');
    console.log('   supabase db push');
    console.log('');
    console.log('📄 SQL para executar:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration();

