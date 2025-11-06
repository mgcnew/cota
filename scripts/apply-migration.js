// Script temporário para aplicar migração SQL
const fs = require('fs');
const path = require('path');

// Importar Supabase client
// Nota: Este script precisa ser executado com Node.js e ter acesso às variáveis de ambiente
async function applyMigration() {
  try {
    // Tentar importar dinamicamente o Supabase
    const { createClient } = require('@supabase/supabase-js');
    
    // Obter credenciais do ambiente
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
      console.log('Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      process.exit(1);
    }
    
    // Criar cliente Supabase (usar service role key se disponível para bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250121000001_fix_product_limit_for_owners.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Lendo migração:', migrationPath);
    console.log('🔄 Aplicando migração...');
    
    // Executar SQL via RPC ou diretamente
    // Nota: Supabase JS não permite executar SQL arbitrário diretamente
    // Precisamos usar o SQL Editor do dashboard ou Supabase CLI
    
    console.log('⚠️  O Supabase JS client não permite executar SQL arbitrário diretamente.');
    console.log('📋 Por favor, execute a migração manualmente:');
    console.log('');
    console.log('Opção 1: Via Supabase Dashboard');
    console.log('  1. Acesse: https://supabase.com/dashboard');
    console.log('  2. Vá em "SQL Editor"');
    console.log('  3. Cole o conteúdo do arquivo:');
    console.log('     supabase/migrations/20250121000001_fix_product_limit_for_owners.sql');
    console.log('  4. Execute o SQL');
    console.log('');
    console.log('Opção 2: Via Supabase CLI');
    console.log('  1. Instale: npm install -g supabase');
    console.log('  2. Execute: supabase db push');
    console.log('');
    console.log('📄 Conteúdo da migração:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro ao tentar aplicar migração:', error.message);
    process.exit(1);
  }
}

applyMigration();

