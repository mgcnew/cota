# Script PowerShell para verificar o estado do servidor
Write-Host "=== DIAGNÓSTICO DO SERVIDOR ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar porta 8080
Write-Host "1. Verificando porta 8080..." -ForegroundColor Yellow
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "   ⚠ Porta 8080 está EM USO!" -ForegroundColor Red
    $process = Get-Process -Id $port8080.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Processo: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✓ Porta 8080 está LIVRE" -ForegroundColor Green
}

# 2. Verificar processos Node.js
Write-Host "`n2. Verificando processos Node.js..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ⚠ Encontrados $($nodeProcesses.Count) processo(s) Node.js:" -ForegroundColor Yellow
    foreach ($proc in $nodeProcesses) {
        Write-Host "   - PID: $($proc.Id) | CPU: $($proc.CPU)s | Memória: $([math]::Round($proc.WS/1MB, 2)) MB" -ForegroundColor Gray
    }
} else {
    Write-Host "   ✓ Nenhum processo Node.js rodando" -ForegroundColor Green
}

# 3. Verificar se vite.config.ts existe
Write-Host "`n3. Verificando arquivos de configuração..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    Write-Host "   ✓ vite.config.ts existe" -ForegroundColor Green
    $config = Get-Content "vite.config.ts" -Raw
    if ($config -match "port:\s*(\d+)") {
        $port = $matches[1]
        Write-Host "   ✓ Porta configurada: $port" -ForegroundColor Green
    }
} else {
    Write-Host "   ✗ vite.config.ts NÃO encontrado!" -ForegroundColor Red
}

# 4. Verificar node_modules
Write-Host "`n4. Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✓ node_modules existe" -ForegroundColor Green
    if (Test-Path "node_modules/vite") {
        Write-Host "   ✓ Vite instalado" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Vite NÃO encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ node_modules NÃO encontrado!" -ForegroundColor Red
    Write-Host "   Execute: npm install" -ForegroundColor Yellow
}

# 5. Verificar versões
Write-Host "`n5. Verificando versões..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js não encontrado!" -ForegroundColor Red
}

try {
    $npmVersion = npm --version
    Write-Host "   ✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ npm não encontrado!" -ForegroundColor Red
}

Write-Host "`n=== RECOMENDAÇÕES ===" -ForegroundColor Cyan
if ($port8080) {
    Write-Host "1. Libere a porta 8080 ou use outra porta" -ForegroundColor Yellow
}
if ($nodeProcesses) {
    Write-Host "2. Finalize processos Node.js antigos se necessário:" -ForegroundColor Yellow
    Write-Host "   Stop-Process -Name node -Force" -ForegroundColor Gray
}
Write-Host "3. Limpe o cache: Remove-Item -Recurse -Force node_modules\.vite" -ForegroundColor Yellow
Write-Host "4. Teste iniciar: npm run dev" -ForegroundColor Yellow
Write-Host ""

