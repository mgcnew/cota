@echo off
echo Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar dependencias
    pause
    exit /b %errorlevel%
)
echo Dependencias instaladas com sucesso!
pause
