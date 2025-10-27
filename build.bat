@echo off
echo Construindo projeto...
call npm run build
if %errorlevel% neq 0 (
    echo Erro ao construir projeto
    pause
    exit /b %errorlevel%
)
echo Projeto construido com sucesso!
pause
