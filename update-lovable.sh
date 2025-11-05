#!/bin/bash
# Script para atualizar código no Lovable
# Execute este script no terminal do Lovable ou peça para o assistente executar

echo "🔄 Atualizando código do repositório..."

# Verificar status atual
echo "📊 Status atual:"
git status

# Buscar mudanças do remoto
echo "⬇️ Buscando mudanças do remoto..."
git fetch origin

# Mostrar commits disponíveis
echo "📝 Últimos commits disponíveis:"
git log --oneline origin/main -5

# Resetar para o commit mais recente do remoto
echo "🔄 Resetando para origin/main..."
git reset --hard origin/main

# Verificar resultado
echo "✅ Status após atualização:"
git log --oneline -1

echo "✨ Atualização concluída!"



