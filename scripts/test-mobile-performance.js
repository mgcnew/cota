#!/usr/bin/env node

/**
 * Script de teste automatizado de performance mobile
 * 
 * Uso:
 *   node scripts/test-mobile-performance.js
 * 
 * Requisitos:
 *   npm install -g lighthouse
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração
const BASE_URL = 'http://localhost:8082';
const PAGES = [
  { name: 'Pedidos', path: '/dashboard/pedidos' },
  { name: 'Relatórios', path: '/dashboard/relatorios' },
  { name: 'WhatsApp', path: '/dashboard/whatsapp-mensagens' },
  { name: 'Configurações', path: '/dashboard/configuracoes' },
];

const REPORTS_DIR = path.join(__dirname, '../lighthouse-reports');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    log(`✓ Diretório de relatórios criado: ${REPORTS_DIR}`, 'green');
  }
}

function runLighthouse(pageName, pageUrl) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORTS_DIR, `${pageName}-${timestamp}.html`);
  const jsonPath = path.join(REPORTS_DIR, `${pageName}-${timestamp}.json`);

  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🔍 Testando: ${pageName}`, 'cyan');
  log(`📍 URL: ${pageUrl}`, 'blue');
  log(`${'='.repeat(60)}`, 'cyan');

  try {
    const command = `lighthouse ${pageUrl} \
      --only-categories=performance \
      --form-factor=mobile \
      --throttling-method=devtools \
      --output=html \
      --output=json \
      --output-path=${reportPath.replace('.html', '')} \
      --chrome-flags="--headless --no-sandbox"`;

    log('⏳ Executando Lighthouse...', 'yellow');
    execSync(command, { stdio: 'inherit' });

    log(`✓ Relatório gerado: ${reportPath}`, 'green');
    
    // Ler e exibir métricas
    if (fs.existsSync(jsonPath)) {
      const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      displayMetrics(report);
    }

    return true;
  } catch (error) {
    log(`✗ Erro ao testar ${pageName}: ${error.message}`, 'red');
    return false;
  }
}

function displayMetrics(report) {
  const audits = report.audits;
  const categories = report.categories;

  log('\n📊 Métricas:', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Performance Score
  const perfScore = Math.round(categories.performance.score * 100);
  const scoreColor = perfScore >= 85 ? 'green' : perfScore >= 50 ? 'yellow' : 'red';
  log(`Performance Score: ${perfScore}/100`, scoreColor);

  // Core Web Vitals
  const metrics = {
    'FCP': audits['first-contentful-paint'],
    'LCP': audits['largest-contentful-paint'],
    'TTI': audits['interactive'],
    'TBT': audits['total-blocking-time'],
    'CLS': audits['cumulative-layout-shift'],
  };

  Object.entries(metrics).forEach(([name, audit]) => {
    if (audit) {
      const value = audit.displayValue || audit.numericValue;
      const score = Math.round(audit.score * 100);
      const color = score >= 90 ? 'green' : score >= 50 ? 'yellow' : 'red';
      log(`${name}: ${value} (${score}/100)`, color);
    }
  });

  log('─'.repeat(60), 'cyan');
}

function generateSummary(results) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 RESUMO DOS TESTES', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\n✓ Páginas testadas com sucesso: ${passed}`, 'green');
  if (failed > 0) {
    log(`✗ Páginas com erro: ${failed}`, 'red');
  }

  log(`\n📁 Relatórios salvos em: ${REPORTS_DIR}`, 'blue');
  log('\n💡 Dica: Abra os arquivos .html no navegador para ver detalhes', 'yellow');
}

async function main() {
  log('\n🚀 Iniciando testes de performance mobile...', 'cyan');
  log('⚠️  Certifique-se de que o servidor está rodando em ' + BASE_URL, 'yellow');

  // Verificar se o servidor está rodando
  try {
    execSync(`curl -s ${BASE_URL} > /dev/null`, { stdio: 'ignore' });
  } catch (error) {
    log('\n✗ Erro: Servidor não está rodando!', 'red');
    log('Execute: npm run dev', 'yellow');
    process.exit(1);
  }

  createReportsDir();

  const results = [];

  for (const page of PAGES) {
    const url = `${BASE_URL}${page.path}`;
    const success = runLighthouse(page.name, url);
    results.push({ page: page.name, success });

    // Aguardar um pouco entre testes
    if (page !== PAGES[PAGES.length - 1]) {
      log('\n⏸️  Aguardando 5 segundos...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  generateSummary(results);

  log('\n✅ Testes concluídos!', 'green');
}

// Executar
main().catch(error => {
  log(`\n✗ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
