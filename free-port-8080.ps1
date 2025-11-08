# Script para liberar a porta 8080 no Windows
Write-Host "Verificando processos usando a porta 8080..." -ForegroundColor Yellow

$port = 8080
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    Write-Host "Porta $port está em uso!" -ForegroundColor Red
    Write-Host ""
    
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Processo encontrado:" -ForegroundColor Yellow
            Write-Host "  Nome: $($process.ProcessName)" -ForegroundColor Cyan
            Write-Host "  PID: $($process.Id)" -ForegroundColor Cyan
            Write-Host "  Caminho: $($process.Path)" -ForegroundColor Cyan
            Write-Host ""
            
            # Perguntar se deseja finalizar
            $response = Read-Host "Deseja finalizar este processo? (S/N)"
            if ($response -eq "S" -or $response -eq "s") {
                try {
                    Stop-Process -Id $process.Id -Force
                    Write-Host "Processo finalizado com sucesso!" -ForegroundColor Green
                } catch {
                    Write-Host "Erro ao finalizar processo: $_" -ForegroundColor Red
                    Write-Host "Tente executar como Administrador" -ForegroundColor Yellow
                }
            }
        }
    }
} else {
    Write-Host "Porta $port está livre!" -ForegroundColor Green
    Write-Host "Você pode iniciar o servidor normalmente." -ForegroundColor Green
}

Write-Host ""
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

