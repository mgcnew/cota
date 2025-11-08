#!/usr/bin/env node

/**
 * Script para analisar o bundle do projeto e identificar componentes pesados
 * Especialmente focado em componentes carregados no mobile
 * 
 * Uso: node scripts/analyze-bundle-mobile.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(process.cwd(), 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeBundle() {
  console.log(`${colors.cyan}${colors.bright}📦 Análise de Bundle Mobile${colors.reset}\n`);

  // Verificar se dist existe
  if (!fs.existsSync(DIST_DIR)) {
    console.log(`${colors.yellow}⚠️  Diretório dist não encontrado. Executando build...${colors.reset}\n`);
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}❌ Erro ao fazer build${colors.reset}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`${colors.red}❌ Diretório dist/assets não encontrado${colors.reset}`);
    process.exit(1);
  }

  // Ler todos os arquivos em assets
  const files = fs.readdirSync(ASSETS_DIR);
  const jsFiles = files.filter(f => f.endsWith('.js'));
  const cssFiles = files.filter(f => f.endsWith('.css'));

  console.log(`${colors.green}✓${colors.reset} Encontrados ${jsFiles.length} arquivos JS e ${cssFiles.length} arquivos CSS\n`);

  // Analisar arquivos JS
  const jsAnalysis = jsFiles.map(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const size = getFileSize(filePath);
    const gzipSize = estimateGzipSize(size);
    
    // Identificar tipo de arquivo pelo nome
    let type = 'outro';
    let component = 'desconhecido';
    
    if (file.includes('ProdutosMobile')) type = 'mobile-produtos';
    else if (file.includes('ProdutosDesktop')) type = 'desktop-produtos';
    else if (file.includes('EditProductDialog')) type = 'dialog';
    else if (file.includes('AddProductDialog')) type = 'dialog';
    else if (file.includes('DeleteProductDialog')) type = 'dialog';
    else if (file.includes('index')) type = 'core';
    else if (file.includes('vendor') || file.includes('chunk')) type = 'vendor';
    
    // Extrair nome do componente
    const match = file.match(/([A-Z][a-zA-Z]+)/);
    if (match) component = match[1];

    return {
      file,
      size,
      gzipSize,
      type,
      component,
      path: filePath,
    };
  }).sort((a, b) => b.size - a.size);

  // Analisar arquivos CSS
  const cssAnalysis = cssFiles.map(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const size = getFileSize(filePath);
    const gzipSize = estimateGzipSize(size);
    
    return {
      file,
      size,
      gzipSize,
      type: 'css',
    };
  });

  // Gerar relatório
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📊 RELATÓRIO DE BUNDLE${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Top 10 maiores arquivos JS
  console.log(`${colors.bright}🔝 Top 10 Maiores Arquivos JS:${colors.reset}\n`);
  jsAnalysis.slice(0, 10).forEach((item, index) => {
    const color = item.size > 500 * 1024 ? colors.red : item.size > 200 * 1024 ? colors.yellow : colors.green;
    console.log(`${index + 1}. ${colors.cyan}${item.file}${colors.reset}`);
    console.log(`   Tamanho: ${color}${formatBytes(item.size)}${colors.reset} (gzip: ${formatBytes(item.gzipSize)})`);
    console.log(`   Tipo: ${item.type} | Componente: ${item.component}\n`);
  });

  // Arquivos Mobile
  console.log(`${colors.bright}📱 Arquivos Mobile:${colors.reset}\n`);
  const mobileFiles = jsAnalysis.filter(f => f.type === 'mobile-produtos' || f.file.includes('Mobile'));
  if (mobileFiles.length > 0) {
    mobileFiles.forEach(item => {
      const color = item.size > 200 * 1024 ? colors.red : colors.green;
      console.log(`  ${colors.cyan}${item.file}${colors.reset}`);
      console.log(`  Tamanho: ${color}${formatBytes(item.size)}${colors.reset} (gzip: ${formatBytes(item.gzipSize)})`);
    });
  } else {
    console.log(`  ${colors.yellow}Nenhum arquivo mobile específico encontrado${colors.reset}`);
  }

  // Dialogs
  console.log(`\n${colors.bright}💬 Dialogs:${colors.reset}\n`);
  const dialogFiles = jsAnalysis.filter(f => f.type === 'dialog');
  if (dialogFiles.length > 0) {
    dialogFiles.forEach(item => {
      const color = item.size > 100 * 1024 ? colors.yellow : colors.green;
      console.log(`  ${colors.cyan}${item.file}${colors.reset}`);
      console.log(`  Tamanho: ${color}${formatBytes(item.size)}${colors.reset} (gzip: ${formatBytes(item.gzipSize)})`);
    });
  }

  // Arquivos CSS
  console.log(`\n${colors.bright}🎨 Arquivos CSS:${colors.reset}\n`);
  cssAnalysis.forEach(item => {
    console.log(`  ${colors.cyan}${item.file}${colors.reset}`);
    console.log(`  Tamanho: ${formatBytes(item.size)} (gzip: ${formatBytes(item.gzipSize)})`);
  });

  // Estatísticas gerais
  const totalJSSize = jsAnalysis.reduce((sum, item) => sum + item.size, 0);
  const totalJSGzipSize = jsAnalysis.reduce((sum, item) => sum + item.gzipSize, 0);
  const totalCSSSize = cssAnalysis.reduce((sum, item) => sum + item.size, 0);
  const totalCSSGzipSize = cssAnalysis.reduce((sum, item) => sum + item.gzipSize, 0);

  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📈 ESTATÍSTICAS GERAIS${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`Total JS: ${colors.bright}${formatBytes(totalJSSize)}${colors.reset} (gzip: ${formatBytes(totalJSGzipSize)})`);
  console.log(`Total CSS: ${colors.bright}${formatBytes(totalCSSSize)}${colors.reset} (gzip: ${formatBytes(totalCSSGzipSize)})`);
  console.log(`Total Geral: ${colors.bright}${formatBytes(totalJSSize + totalCSSSize)}${colors.reset} (gzip: ${formatBytes(totalJSGzipSize + totalCSSGzipSize)})`);

  // Recomendações
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}💡 RECOMENDAÇÕES${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const largeFiles = jsAnalysis.filter(f => f.size > 500 * 1024);
  if (largeFiles.length > 0) {
    console.log(`${colors.yellow}⚠️  Arquivos grandes (>500KB) encontrados:${colors.reset}`);
    largeFiles.forEach(item => {
      console.log(`  - ${item.file} (${formatBytes(item.size)})`);
      console.log(`    Considere code splitting ou lazy loading`);
    });
  }

  const mobileLargeFiles = mobileFiles.filter(f => f.size > 200 * 1024);
  if (mobileLargeFiles.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Arquivos mobile grandes (>200KB) encontrados:${colors.reset}`);
    mobileLargeFiles.forEach(item => {
      console.log(`  - ${item.file} (${formatBytes(item.size)})`);
      console.log(`    Otimizar para mobile: remover imports pesados, usar lazy loading`);
    });
  }

  // Salvar relatório em arquivo
  const reportPath = path.join(process.cwd(), 'bundle-analysis-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    jsFiles: jsAnalysis,
    cssFiles: cssAnalysis,
    statistics: {
      totalJSSize,
      totalJSGzipSize,
      totalCSSSize,
      totalCSSGzipSize,
      totalSize: totalJSSize + totalCSSSize,
      totalGzipSize: totalJSGzipSize + totalCSSGzipSize,
    },
    recommendations: {
      largeFiles: largeFiles.map(f => ({ file: f.file, size: f.size })),
      mobileLargeFiles: mobileLargeFiles.map(f => ({ file: f.file, size: f.size })),
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${colors.green}✓${colors.reset} Relatório salvo em: ${reportPath}`);
}

function estimateGzipSize(size) {
  // Estimativa conservadora: gzip geralmente reduz para ~30% do tamanho original
  return Math.round(size * 0.3);
}

// Executar análise
try {
  analyzeBundle();
} catch (error) {
  console.error(`${colors.red}❌ Erro:${colors.reset}`, error.message);
  process.exit(1);
}

