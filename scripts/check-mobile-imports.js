#!/usr/bin/env node

/**
 * Script para verificar imports em componentes mobile
 * Identifica imports pesados ou de componentes desktop que podem ser otimizados
 * 
 * Uso: node scripts/check-mobile-imports.js
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Bibliotecas pesadas conhecidas
const HEAVY_LIBRARIES = [
  'framer-motion',
  'recharts',
  'html2canvas',
  'jspdf',
  'xlsx',
  'react-window',
  'react-resizable-panels',
  'date-fns',
  'lodash',
  'moment',
];

// Componentes desktop que não deveriam estar no mobile
const DESKTOP_COMPONENTS = [
  'ProdutosDesktop',
  'ProductsVirtualList',
  'ProductCardMemoized',
  'Table',
  'DataTable',
];

// Componentes que devem usar lazy loading
const SHOULD_BE_LAZY = [
  'EditProductDialog',
  'AddProductDialog',
  'DeleteProductDialog',
  'ViewQuoteDialog',
  'AddQuoteDialog',
];

function findFiles(dir, extension = '.tsx') {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (item.isFile() && item.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  const imports = [];

  // Analisar imports
  lines.forEach((line, index) => {
    // Detectar imports
    const importMatch = line.match(/import\s+(?:.*\s+from\s+)?['"](.+?)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      imports.push({ path: importPath, line: index + 1, content: line.trim() });

      // Verificar bibliotecas pesadas
      if (HEAVY_LIBRARIES.some(lib => importPath.includes(lib))) {
        issues.push({
          type: 'heavy-library',
          severity: 'warning',
          message: `Biblioteca pesada importada: ${importPath}`,
          line: index + 1,
          import: importPath,
        });
      }

      // Verificar componentes desktop
      if (DESKTOP_COMPONENTS.some(comp => importPath.includes(comp))) {
        issues.push({
          type: 'desktop-component',
          severity: 'error',
          message: `Componente desktop importado no mobile: ${importPath}`,
          line: index + 1,
          import: importPath,
        });
      }
    }

    // Verificar se componentes que deveriam ser lazy não são
    if (line.includes('import') && !line.includes('lazy') && !line.includes('dynamic')) {
      SHOULD_BE_LAZY.forEach(comp => {
        if (line.includes(comp)) {
          issues.push({
            type: 'not-lazy',
            severity: 'warning',
            message: `Componente ${comp} deveria usar lazy loading`,
            line: index + 1,
            import: comp,
          });
        }
      });
    }
  });

  return { imports, issues, lineCount: lines.length };
}

function analyzeMobileFiles() {
  console.log(`${colors.cyan}${colors.bright}🔍 Análise de Imports Mobile${colors.reset}\n`);

  const srcDir = path.join(process.cwd(), 'src');
  const mobileDir = path.join(srcDir, 'pages', 'ProdutosMobile.tsx');
  const mobileComponentsDir = path.join(srcDir, 'components', 'mobile');
  
  // Arquivos para analisar
  const filesToAnalyze = [];
  
  // Adicionar página mobile
  if (fs.existsSync(mobileDir)) {
    filesToAnalyze.push(mobileDir);
  }

  // Adicionar componentes mobile
  if (fs.existsSync(mobileComponentsDir)) {
    filesToAnalyze.push(...findFiles(mobileComponentsDir));
  }

  // Adicionar hooks mobile
  const mobileHooksDir = path.join(srcDir, 'hooks', 'mobile');
  if (fs.existsSync(mobileHooksDir)) {
    filesToAnalyze.push(...findFiles(mobileHooksDir));
  }

  console.log(`${colors.green}✓${colors.reset} Analisando ${filesToAnalyze.length} arquivos...\n`);

  const results = filesToAnalyze.map(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const analysis = analyzeFile(filePath);
    return {
      file: relativePath,
      ...analysis,
    };
  });

  // Gerar relatório
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📊 RELATÓRIO DE IMPORTS${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  let totalIssues = 0;
  let errorCount = 0;
  let warningCount = 0;

  results.forEach(result => {
    if (result.issues.length > 0) {
      totalIssues += result.issues.length;
      console.log(`${colors.bright}${colors.cyan}${result.file}${colors.reset}`);
      console.log(`  ${colors.yellow}${result.issues.length} problema(s) encontrado(s)${colors.reset}\n`);

      result.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        const color = issue.severity === 'error' ? colors.red : colors.yellow;
        if (issue.severity === 'error') errorCount++;
        else warningCount++;

        console.log(`  ${icon} ${color}${issue.severity.toUpperCase()}${colors.reset}: ${issue.message}`);
        console.log(`     Linha ${issue.line}: ${issue.import || ''}`);
        console.log();
      });
    }
  });

  // Estatísticas
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📈 ESTATÍSTICAS${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const totalImports = results.reduce((sum, r) => sum + r.imports.length, 0);
  const totalLines = results.reduce((sum, r) => sum + r.lineCount, 0);

  console.log(`Arquivos analisados: ${colors.bright}${results.length}${colors.reset}`);
  console.log(`Total de imports: ${colors.bright}${totalImports}${colors.reset}`);
  console.log(`Total de linhas: ${colors.bright}${totalLines}${colors.reset}`);
  console.log(`Problemas encontrados: ${colors.bright}${totalIssues}${colors.reset}`);
  console.log(`  ${colors.red}Erros: ${errorCount}${colors.reset}`);
  console.log(`  ${colors.yellow}Avisos: ${warningCount}${colors.reset}`);

  // Resumo de imports por tipo
  console.log(`\n${colors.bright}📦 IMPORTS POR TIPO:${colors.reset}\n`);

  const importsByType = {};
  results.forEach(result => {
    result.imports.forEach(imp => {
      const type = categorizeImport(imp.path);
      if (!importsByType[type]) {
        importsByType[type] = [];
      }
      importsByType[type].push(imp.path);
    });
  });

  Object.keys(importsByType).sort().forEach(type => {
    const unique = [...new Set(importsByType[type])];
    console.log(`  ${colors.cyan}${type}${colors.reset}: ${unique.length} imports únicos`);
  });

  // Recomendações
  if (totalIssues > 0) {
    console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}💡 RECOMENDAÇÕES${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

    if (errorCount > 0) {
      console.log(`${colors.red}❌${colors.reset} Remover imports de componentes desktop do mobile`);
      console.log(`   Use componentes específicos para mobile ou lazy loading\n`);
    }

    if (warningCount > 0) {
      console.log(`${colors.yellow}⚠️${colors.reset} Considere usar lazy loading para:`);
      console.log(`   - Dialogs e modais`);
      console.log(`   - Bibliotecas pesadas`);
      console.log(`   - Componentes usados raramente\n`);
    }
  }

  // Salvar relatório
  const reportPath = path.join(process.cwd(), 'mobile-imports-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    files: results.map(r => ({
      file: r.file,
      importsCount: r.imports.length,
      issuesCount: r.issues.length,
      issues: r.issues,
    })),
    statistics: {
      totalFiles: results.length,
      totalImports,
      totalLines,
      totalIssues,
      errorCount,
      warningCount,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.green}✓${colors.reset} Relatório salvo em: ${reportPath}`);
}

function categorizeImport(importPath) {
  if (importPath.startsWith('@/')) return 'local';
  if (importPath.startsWith('.')) return 'relative';
  if (HEAVY_LIBRARIES.some(lib => importPath.includes(lib))) return 'heavy-library';
  if (importPath.includes('react')) return 'react';
  if (importPath.includes('lucide-react')) return 'icons';
  if (importPath.includes('@radix-ui')) return 'radix-ui';
  if (importPath.includes('@tanstack')) return 'tanstack';
  return 'other';
}

// Executar análise
try {
  analyzeMobileFiles();
} catch (error) {
  console.error(`${colors.red}❌ Erro:${colors.reset}`, error.message);
  process.exit(1);
}

