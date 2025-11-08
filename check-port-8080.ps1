# Script para verificar se a porta 8080 está em uso no Windows
Write-Host "=== VERIFICAÇÃO DA PORTA 8080 ===" -ForegroundColor Cyan
Write-Host ""

$port = 8080
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    Write-Host "❌ Porta $port está EM USO!" -ForegroundColor Red
    Write-Host ""
    
    $uniqueProcesses = $connections | Select-Object -Unique OwningProcess
    foreach ($conn in $uniqueProcesses) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Processo encontrado:" -ForegroundColor Yellow
            Write-Host "  Nome: $($process.ProcessName)" -ForegroundColor Cyan
            Write-Host "  PID: $($process.Id)" -ForegroundColor Cyan
            Write-Host "  Caminho: $($process.Path)" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    Write-Host "Para liberar a porta, execute:" -ForegroundColor Yellow
    Write-Host "  Stop-Process -Id <PID> -Force" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ou execute este script como Administrador e ele perguntará se deseja finalizar." -ForegroundColor Yellow
} else {
    Write-Host "✅ Porta $port está LIVRE!" -ForegroundColor Green
    Write-Host "Você pode iniciar o servidor normalmente com: npm run dev" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

