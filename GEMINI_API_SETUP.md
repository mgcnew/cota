# Configuração da API Key do Gemini

## Opção 1: Variável de Ambiente (Recomendado)

1. Crie um arquivo `.env.local` na raiz do projeto `cotaja/`
2. Adicione sua API key:

```env
VITE_GEMINI_API_KEY=AIzaSyAuLwffF13_0aHKc8X5LEhw5-wp4kQmj0c
```

3. Reinicie o servidor de desenvolvimento (`npm run dev`)

**Nota:** O arquivo `.env.local` já está no `.gitignore`, então sua API key não será commitada.

## Opção 2: Configurar via Interface

Você também pode configurar a API key diretamente na interface:
- Na página **Agente de Copywriting**: coloque a API key no campo "API Key" e clique em salvar
- Na página **Locuções**: configure através do diálogo de configurações

A API key será salva no localStorage do navegador.

## Segurança

⚠️ **Importante:**
- Nunca commite a API key no código
- Use variável de ambiente em produção
- A API key será visível no código frontend (client-side), então configure restrições no console do Google Cloud se necessário

