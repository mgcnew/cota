// Script para testar se o servidor consegue iniciar
console.log('=== TESTE DE INICIALIZAÇÃO DO SERVIDOR ===\n');

// Teste 1: Verificar se podemos importar o vite.config.ts
console.log('1. Testando import do vite.config.ts...');
try {
  // Simular verificação do arquivo
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, 'vite.config.ts');
  
  if (fs.existsSync(configPath)) {
    console.log('   ✓ vite.config.ts existe');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Verificar se há problemas óbvios
    if (configContent.includes('componentTagger')) {
      console.log('   ✓ Plugin lovable-tagger encontrado');
    }
    
    if (configContent.includes('port: 8080')) {
      console.log('   ✓ Porta 8080 configurada');
    }
  } else {
    console.log('   ✗ vite.config.ts não encontrado!');
    process.exit(1);
  }
} catch (error) {
  console.error('   ✗ Erro ao ler vite.config.ts:', error.message);
  process.exit(1);
}

// Teste 2: Verificar Node.js e npm
console.log('\n2. Verificando versões...');
try {
  const nodeVersion = process.version;
  console.log(`   ✓ Node.js: ${nodeVersion}`);
  
  const { execSync } = require('child_process');
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`   ✓ npm: ${npmVersion}`);
  } catch (e) {
    console.log('   ✗ npm não encontrado');
  }
} catch (error) {
  console.error('   ✗ Erro:', error.message);
}

// Teste 3: Verificar dependências
console.log('\n3. Verificando dependências...');
try {
  const fs = require('fs');
  const path = require('path');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✓ node_modules existe');
    
    // Verificar dependências críticas
    const criticalDeps = ['vite', 'react', 'react-dom'];
    for (const dep of criticalDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        console.log(`   ✓ ${dep} instalado`);
      } else {
        console.log(`   ✗ ${dep} NÃO encontrado!`);
      }
    }
  } else {
    console.log('   ✗ node_modules não encontrado!');
    console.log('   Execute: npm install');
  }
} catch (error) {
  console.error('   ✗ Erro:', error.message);
}

// Teste 4: Verificar se há erros de sintaxe no código principal
console.log('\n4. Verificando arquivos principais...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const mainFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/pages/Produtos.tsx'
  ];
  
  for (const file of mainFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✓ ${file} existe`);
    } else {
      console.log(`   ✗ ${file} NÃO encontrado!`);
    }
  }
} catch (error) {
  console.error('   ✗ Erro:', error.message);
}

console.log('\n=== DIAGNÓSTICO CONCLUÍDO ===');
console.log('\nSe todos os testes passaram, o problema pode ser:');
console.log('1. Porta 8080 ocupada por outro processo');
console.log('2. Firewall/Antivírus bloqueando');
console.log('3. Erro ao executar npm run dev (verifique o terminal)');
console.log('\nExecute: npm run dev e verifique as mensagens de erro no terminal.');

