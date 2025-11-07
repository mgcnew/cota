@echo off
echo ========================================
echo   TESTE RAPIDO - ACESSO PELA INTERNET
echo ========================================
echo.
echo Escolha uma opcao:
echo.
echo 1. Iniciar servidor local (porta 8080)
echo 2. Ver IP local para acesso na mesma rede
echo 3. Instrucoes para ngrok
echo 4. Instrucoes para Vercel
echo.
set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" (
    echo.
    echo Iniciando servidor...
    cd cotaja
    npm run dev
)

if "%opcao%"=="2" (
    echo.
    echo Seu IP local:
    ipconfig | findstr IPv4
    echo.
    echo Acesse no celular (mesma WiFi): http://SEU_IP:8080
    pause
)

if "%opcao%"=="3" (
    echo.
    echo ========================================
    echo   NGROK - Teste Rapido
    echo ========================================
    echo.
    echo 1. Baixe ngrok: https://ngrok.com/download
    echo 2. Extraia ngrok.exe
    echo 3. Execute: ngrok http 8080
    echo 4. Copie a URL que aparece
    echo 5. Acesse no celular usando essa URL
    echo.
    pause
)

if "%opcao%"=="4" (
    echo.
    echo ========================================
    echo   VERCEL - Deploy Permanente
    echo ========================================
    echo.
    echo 1. Acesse: https://vercel.com
    echo 2. Login com GitHub
    echo 3. Add New Project
    echo 4. Importe o repositorio
    echo 5. Deploy!
    echo.
    pause
)

