# Script para iniciar o servidor de desenvolvimento
Write-Host "=== INICIANDO SERVIDOR DE DESENVOLVIMENTO ===" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ ERRO: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script do diretório do projeto (cotaja)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor Yellow
    Write-Host "  cd C:\Users\davi\Documents\cursor\cotaja" -ForegroundColor Gray
    Write-Host "  .\iniciar-servidor.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Diretório correto encontrado" -ForegroundColor Green
Write-Host ""

# Limpar cache
Write-Host "Limpando cache do Vite..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Write-Host "✓ Cache limpo" -ForegroundColor Green
Write-Host ""

# Verificar porta 8080
Write-Host "Verificando porta 8080..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "⚠ Porta 8080 está em uso!" -ForegroundColor Yellow
    Write-Host "O Vite tentará usar outra porta automaticamente" -ForegroundColor Gray
} else {
    Write-Host "✓ Porta 8080 está livre" -ForegroundColor Green
}
Write-Host ""

# Iniciar servidor
Write-Host "Iniciando servidor..." -ForegroundColor Cyan
Write-Host "URL esperada: http://localhost:8080/" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

npm run dev

